// lib/indexedDB.js
// Centralized IndexedDB helpers with cache-first logic for all stores
// Uses idb (https://github.com/jakearchibald/idb)

import { openDB } from 'idb';
import { Eagle_Lake } from 'next/font/google';

/**
 * Cache staleness helper (days → ms)
 */
export function isStale(cachedAt, maxAgeDays = 30) {
    if (!cachedAt) return true;
    const age = Date.now() - cachedAt;
    return age > maxAgeDays * 24 * 60 * 60 * 1000;
}

/**
 * initDB with migration to guarantee searchIndex has the correct schema:
 * - keyPath: 'legal_id' (Number)
 * - index: 'entity_name'
 */
export async function initDB() {
    return openDB('AciujumsDB', 16, {
        upgrade(db, oldVersion, newVersion, tx) {
            // Create (if missing) the other stores
            if (!db.objectStoreNames.contains('indexDataByYear')) {
                db.createObjectStore('indexDataByYear', { keyPath: 'year' });
            }
            if (!db.objectStoreNames.contains('municipalityData')) {
                db.createObjectStore('municipalityData'); // key: municipality string
            }
            if (!db.objectStoreNames.contains('entityData')) {
                db.createObjectStore('entityData'); // key: legal_id (Number or String consistently in callers)
            }
            if (!db.objectStoreNames.contains('searchHistory')) {
                db.createObjectStore('searchHistory', { keyPath: 'legal_id' });
            }

            if (!db.objectStoreNames.contains('meta')) {
                db.createObjectStore('meta', { keyPath: 'key' });
            }

            // Ensure searchIndex is in the correct shape; recreate if needed
            const recreateSearchIndex = () => {
                const store = db.createObjectStore('searchIndex', { keyPath: 'legal_id' });
                store.createIndex('entity_name', 'entity_name', { unique: false });
            };

            if (db.objectStoreNames.contains('searchIndex')) {
                // Inspect existing store inside the upgrade transaction; if wrong, drop & recreate
                try {
                    const s = tx.objectStore('searchIndex');
                    const hasRightKeyPath = s.keyPath === 'legal_id';
                    const hasIndex = s.indexNames && s.indexNames.contains('entity_name');
                    if (!hasRightKeyPath || !hasIndex) {
                        db.deleteObjectStore('searchIndex');
                        recreateSearchIndex();
                    }
                } catch {
                    // If inspection fails for any reason, recreate
                    db.deleteObjectStore('searchIndex');
                    recreateSearchIndex();
                }
            } else {
                recreateSearchIndex();
            }
        },
    });
}

/* =========================
 * Index Data (by Year)
 * ========================= */
export async function saveIndexDataByYear(dataArray) {
    const db = await initDB();
    const tx = db.transaction(['indexDataByYear', 'meta'], 'readwrite');
    const store = tx.objectStore('indexDataByYear');
    const now = Date.now();

    const groupedByYear = {};
    for (const entry of dataArray) {
        if (!groupedByYear[entry.year]) groupedByYear[entry.year] = [];
        groupedByYear[entry.year].push(entry);
    }

    for (const year of Object.keys(groupedByYear)) {
        await store.put({ year: Number(year), data: groupedByYear[year], cachedAt: now });
    }
    await tx.objectStore('meta').put({ key: 'indexDataByYear', cachedAt: now });
    await tx.done;
}

export async function getAllIndexData() {
    const db = await initDB();
    return db.getAll('indexDataByYear');
}

export async function fetchAndStoreIndexData() {
    try {
        const res = await fetch('https://gplb8fov1k.execute-api.eu-central-1.amazonaws.com/api/index_data');
        const json = await res.json();
        await saveIndexDataByYear(json.data);
        return json.data;
    } catch (err) {
        console.error('Error fetching index data:', err);
        return [];
    }
}

export async function getIndexDataWithCache({ force = false, maxAgeDays = 30 } = {}) {
    const db = await initDB();
    const meta = await db.get('meta', 'indexDataByYear');
    const fresh = !force && meta?.cachedAt && !isStale(meta.cachedAt, maxAgeDays);

    if (fresh) {
        const all = await getAllIndexData();
        console.log("Loading.........")
        return all.flatMap((x) => x.data);
    }
    return await fetchAndStoreIndexData();
}

export async function getAvailableYears() {
    const db = await initDB();
    const all = await db.getAll('indexDataByYear');
    return all.map((e) => e.year).sort((a, b) => a - b);
}

/* =========================
 * Municipality Data
 * ========================= */
export async function saveMunicipalityData(municipality, value) {
    const db = await initDB();
    return db.put('municipalityData', { ...value, cachedAt: Date.now() }, municipality);
}

export async function loadMunicipalityData(municipality) {
    const db = await initDB();
    return db.get('municipalityData', municipality);
}

export async function fetchAndStoreMunicipalityData(municipality, year) {
    try {
        const res = await fetch(`https://gplb8fov1k.execute-api.eu-central-1.amazonaws.com/api/municipality_data?municipality=${municipality}&year=${year}`);
        const json = await res.json();
        await saveMunicipalityData(municipality, { data: json, latestYear: year });
        return { data: json, latestYear: year };
    } catch (err) {
        console.error('Error fetching municipality data:', err);
        return null;
    }
}

export async function getMunicipalityDataWithCache(municipality, year, { force = false, maxAgeDays = 30 } = {}) {
    const cached = await loadMunicipalityData(municipality);
    if (!force && cached && !isStale(cached.cachedAt, maxAgeDays)) return cached;
    return await fetchAndStoreMunicipalityData(municipality, year);
}

/* =========================
 * Entity Data (per legal_id)
 * ========================= */
export async function saveEntityData(legal_id, value) {
    const db = await initDB();
    return db.put('entityData', { ...value, cachedAt: Date.now() }, legal_id);
}

export async function loadEntityData(legal_id) {
    const db = await initDB();
    return db.get('entityData', legal_id);
}

export async function fetchAndStoreEntityData(legal_id) {
    try {
        const res = await fetch(`https://gplb8fov1k.execute-api.eu-central-1.amazonaws.com/api/entity_data?legal_id=${legal_id}`);
        const json = await res.json();
        await saveEntityData(legal_id, json);
        return json;
    } catch (err) {
        console.error('Error fetching entity data:', err);
        return null;
    }
}

export async function getEntityDataWithCache(legal_id, { force = false, maxAgeDays = 30 } = {}) {
    const cached = await loadEntityData(legal_id);
    if (!force && cached && !isStale(cached.cachedAt, maxAgeDays)) return cached;
    return await fetchAndStoreEntityData(legal_id);
}

/* =========================
 * Search Index (legal_id → { legal_id, entity_name })
 * ========================= */

/**
 * Download + (re)build the search index store.
 * - Records: { legal_id: Number, entity_name: String }
 * - Metadata record: { legal_id: -1, cachedAt: Number }
 */
export async function fetchAndStoreSearchIndex() {
    console.log("LOADING...")
    try {
        const res = await fetch('https://gplb8fov1k.execute-api.eu-central-1.amazonaws.com/api/search_index');
        const data = await res.json();

        const db = await initDB();
        const tx = db.transaction(['searchIndex', 'meta'], 'readwrite');
        const store = tx.objectStore('searchIndex');

        await store.clear();

        for (const row of data) {
            const legalIdNum = Number(row.legal_id);
            if (!Number.isFinite(legalIdNum)) continue;

            // Do NOT pass a second argument — let keyPath:'legal_id' handle it
            await store.put({
                legal_id: legalIdNum,
                entity_name: row.entity_name
            });
        }

        // stamp freshness in separate meta store
        await tx.objectStore('meta').put({ key: 'searchIndex', cachedAt: Date.now() });
        await tx.done;

    } catch (err) {
        console.error('Error fetching search index:', err);
        return null;
    }
}

/**
 * Returns a plain object { [legal_id]: entity_name } if cache is fresh,
 * otherwise refreshes it from API.
 */
export async function getSearchIndexWithCache({ force = false, maxAgeDays = 30 } = {}) {
    const db = await initDB();

    // read freshness from meta store
    const meta = await db.get('meta', 'searchIndex');
    const fresh = !force && meta?.cachedAt && !isStale(meta.cachedAt, maxAgeDays);

    if (fresh) {
        const store = db.transaction('searchIndex').objectStore('searchIndex');
        const keys = await store.getAllKeys();
        const result = {};
        for (const key of keys) {
            const row = await store.get(key);
            if (row?.legal_id != null) result[row.legal_id] = row.entity_name;
        }
        return result;
    }

    return await fetchAndStoreSearchIndex();
}

/**
 * Prefix search by entity name via the 'entity_name' index.
 * Returns an array of { legal_id, entity_name }.
 */
export async function searchEntitiesByNamePrefix(prefix, limit = 5) {
    if (!prefix || prefix.length === 0) return [];
    const db = await initDB();
    const tx = db.transaction('searchIndex');
    const store = tx.objectStore('searchIndex');

    if (!store.indexNames.contains('entity_name')) {
        console.warn('Missing entity_name index — IndexedDB upgrade required.');
        return [];
    }

    const index = store.index('entity_name');
    const results = [];
    const lower = prefix.toLowerCase();

    // Iterate the index (keeps memory low). Stop once we have `limit` matches.
    for await (const cursor of index.iterate()) {
        const name = (cursor.value?.entity_name || '').toLowerCase();
        if (name.startsWith(lower)) {
            results.push(cursor.value);
            if (results.length >= limit) break;
        }
    }

    return results;
}

/* =========================
 * Optional: simple helpers for search history (max 5 entries)
 * ========================= */
export async function addToSearchHistory(entry, max = 5) {
    // entry: { legal_id, entity_name }
    const db = await initDB();
    const tx = db.transaction('searchHistory', 'readwrite');
    const store = tx.objectStore('searchHistory');
    await store.put({ ...entry, updatedAt: Date.now() });

    // Enforce max size
    const all = await store.getAll();
    const sorted = all.sort((a, b) => b.updatedAt - a.updatedAt);
    const excess = sorted.slice(max);
    for (const r of excess) await store.delete(r.legal_id);
    await tx.done;
}

export async function getSearchHistory(limit = 5) {
    const db = await initDB();
    const all = await db.getAll('searchHistory');
    return all.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}
