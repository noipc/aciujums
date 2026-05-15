// lib/indexedDB.js
// Centralized IndexedDB helpers with cache-first logic for all stores.
// Cache freshness is governed by dual-source server timestamps (RC + VMI)
// exposed via GET /metadata. Each `meta` entry records the server
// timestamps it was generated from; on read we compare them against the
// latest server stamps and selectively invalidate stale stores.
//
// Source mapping (per AGENTS spec):
//   - indexDataByYear   → 'rc'        (RC-derived summary)
//   - municipalityData  → 'vmi'       (VMI finances aggregation)
//   - entityData        → 'rc' + 'vmi' (combined: RC info + VMI finances)
//   - searchIndex       → 'rc' + 'vmi' (combined: built atop both feeds)

if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_API_URL) {
    console.warn('[indexedDB] NEXT_PUBLIC_API_URL is not set — falling back to hardcoded endpoint.');
}
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://gplb8fov1k.execute-api.eu-central-1.amazonaws.com/api').replace(/\/$/, '');

import { openDB } from 'idb';

/* =========================
 * Server metadata
 * ========================= */

/**
 * Fetch the current per-source server timestamps. Always bypasses HTTP cache.
 * Returns `{ rc, vmi }` where each value is a ms-epoch number or null.
 */
export async function fetchServerMetadata() {
    try {
        const res = await fetch(`${API_BASE}/metadata`, { cache: 'no-store' });
        if (!res.ok) return { rc: null, vmi: null };
        const json = await res.json();
        return {
            rc: typeof json?.rc === 'number' ? json.rc : null,
            vmi: typeof json?.vmi === 'number' ? json.vmi : null,
        };
    } catch {
        return { rc: null, vmi: null };
    }
}

let _serverMetaPromise = null;
/**
 * In-memory memoized accessor: each page navigation triggers at most a
 * single /metadata round-trip shared across the *WithCache helpers.
 */
export function getServerMetadata({ force = false } = {}) {
    if (force || !_serverMetaPromise) {
        _serverMetaPromise = fetchServerMetadata();
    }
    return _serverMetaPromise;
}

/**
 * Returns true iff the local meta record is missing or any of the listed
 * sources has advanced server-side since it was written.
 *
 * @param {object|undefined} localMeta  Existing IndexedDB meta record.
 * @param {{rc:?number,vmi:?number}} server  Current server timestamps.
 * @param {Array<'rc'|'vmi'>} sources  Which sources this store depends on.
 */
export function isMetaStale(localMeta, server, sources) {
    if (!localMeta) return true;
    for (const src of sources) {
        const srv = server?.[src];
        if (srv == null) continue; // Can't determine — don't invalidate on unknown.
        const local = localMeta[`${src}_timestamp`];
        if (local == null || srv > local) return true;
    }
    return false;
}

/** Build a meta payload stamping the relevant server timestamps. */
function buildMetaRecord(key, server, sources) {
    const record = { key, cachedAt: Date.now() };
    for (const src of sources) {
        record[`${src}_timestamp`] = server?.[src] ?? null;
    }
    return record;
}

/* =========================
 * DB init
 * ========================= */

export async function initDB() {
    return openDB('AciujumsDB', 16, {
        upgrade(db, oldVersion, newVersion, tx) {
            if (!db.objectStoreNames.contains('indexDataByYear')) {
                db.createObjectStore('indexDataByYear', { keyPath: 'year' });
            }
            if (!db.objectStoreNames.contains('municipalityData')) {
                db.createObjectStore('municipalityData');
            }
            if (!db.objectStoreNames.contains('entityData')) {
                db.createObjectStore('entityData');
            }
            if (!db.objectStoreNames.contains('searchHistory')) {
                db.createObjectStore('searchHistory', { keyPath: 'legal_id' });
            }
            if (!db.objectStoreNames.contains('meta')) {
                db.createObjectStore('meta', { keyPath: 'key' });
            }

            const recreateSearchIndex = () => {
                const store = db.createObjectStore('searchIndex', { keyPath: 'legal_id' });
                store.createIndex('entity_name', 'entity_name', { unique: false });
            };

            if (db.objectStoreNames.contains('searchIndex')) {
                try {
                    const s = tx.objectStore('searchIndex');
                    const hasRightKeyPath = s.keyPath === 'legal_id';
                    const hasIndex = s.indexNames && s.indexNames.contains('entity_name');
                    if (!hasRightKeyPath || !hasIndex) {
                        db.deleteObjectStore('searchIndex');
                        recreateSearchIndex();
                    }
                } catch {
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
 * Index Data (by Year) — RC source
 * ========================= */
const INDEX_SOURCES = ['rc'];

export async function getAllIndexData() {
    const db = await initDB();
    return db.getAll('indexDataByYear');
}

async function clearIndexData(db) {
    const tx = db.transaction(['indexDataByYear', 'meta'], 'readwrite');
    await tx.objectStore('indexDataByYear').clear();
    await tx.objectStore('meta').delete('indexDataByYear');
    await tx.done;
}

async function writeIndexData(db, dataArray, server) {
    const tx = db.transaction(['indexDataByYear', 'meta'], 'readwrite');
    const store = tx.objectStore('indexDataByYear');
    await store.clear();

    const groupedByYear = {};
    for (const entry of dataArray) {
        if (!groupedByYear[entry.year]) groupedByYear[entry.year] = [];
        groupedByYear[entry.year].push(entry);
    }
    const now = Date.now();
    for (const year of Object.keys(groupedByYear)) {
        await store.put({ year: Number(year), data: groupedByYear[year], cachedAt: now });
    }
    await tx.objectStore('meta').put(buildMetaRecord('indexDataByYear', server, INDEX_SOURCES));
    await tx.done;
}

export async function fetchAndStoreIndexData(server) {
    try {
        const meta = server ?? await getServerMetadata();
        const res = await fetch(`${API_BASE}/index_data`, { cache: 'no-store' });
        const json = await res.json();
        const db = await initDB();
        await writeIndexData(db, json.data || [], meta);
        return json.data || [];
    } catch (err) {
        process.env.NODE_ENV !== 'production' && console.error('Error fetching index data:', err);
        return [];
    }
}

export async function getIndexDataWithCache({ force = false } = {}) {
    const db = await initDB();
    const server = await getServerMetadata({ force });
    const localMeta = await db.get('meta', 'indexDataByYear');
    const stale = force || isMetaStale(localMeta, server, INDEX_SOURCES);

    if (stale) {
        await clearIndexData(db);
        return await fetchAndStoreIndexData(server);
    }
    const all = await getAllIndexData();
    return all.flatMap((x) => x.data);
}

export async function getAvailableYears() {
    const db = await initDB();
    const all = await db.getAll('indexDataByYear');
    return all.map((e) => e.year).sort((a, b) => a - b);
}

/* =========================
 * Municipality Data — VMI source
 * ========================= */
const MUNICIPALITY_SOURCES = ['vmi'];

export async function loadMunicipalityData(municipality) {
    const db = await initDB();
    return db.get('municipalityData', municipality);
}

async function clearMunicipalityData(db) {
    const tx = db.transaction(['municipalityData', 'meta'], 'readwrite');
    await tx.objectStore('municipalityData').clear();
    await tx.objectStore('meta').delete('municipalityData');
    await tx.done;
}

export async function fetchAndStoreMunicipalityData(municipality, year, server) {
    try {
        const meta = server ?? await getServerMetadata();
        const res = await fetch(`${API_BASE}/municipality_data?municipality=${municipality}&year=${year}`, { cache: 'no-store' });
        const json = await res.json();
        const db = await initDB();
        const tx = db.transaction(['municipalityData', 'meta'], 'readwrite');
        await tx.objectStore('municipalityData').put({ data: json, latestYear: year, cachedAt: Date.now() }, municipality);
        await tx.objectStore('meta').put(buildMetaRecord('municipalityData', meta, MUNICIPALITY_SOURCES));
        await tx.done;
        return { data: json, latestYear: year };
    } catch (err) {
        process.env.NODE_ENV !== 'production' && console.error('Error fetching municipality data:', err);
        return null;
    }
}

export async function getMunicipalityDataWithCache(municipality, year, { force = false } = {}) {
    const db = await initDB();
    const server = await getServerMetadata({ force });
    const localMeta = await db.get('meta', 'municipalityData');
    const stale = force || isMetaStale(localMeta, server, MUNICIPALITY_SOURCES);

    if (stale) {
        await clearMunicipalityData(db);
        return await fetchAndStoreMunicipalityData(municipality, year, server);
    }
    const cached = await loadMunicipalityData(municipality);
    if (cached && cached.latestYear === year) return cached;
    // Cache is fresh for the source but missing this (municipality, year)
    // pair — fetch without busting the rest of the store.
    return await fetchAndStoreMunicipalityData(municipality, year, server);
}

/* =========================
 * Entity Data — combined RC + VMI
 * ========================= */
const ENTITY_SOURCES = ['rc', 'vmi'];

export async function loadEntityData(legal_id) {
    const db = await initDB();
    return db.get('entityData', legal_id);
}

async function clearEntityData(db) {
    const tx = db.transaction(['entityData', 'meta'], 'readwrite');
    await tx.objectStore('entityData').clear();
    await tx.objectStore('meta').delete('entityData');
    await tx.done;
}

export async function fetchAndStoreEntityData(legal_id, server) {
    try {
        const meta = server ?? await getServerMetadata();
        const res = await fetch(`${API_BASE}/entity_data?legal_id=${legal_id}`, { cache: 'no-store' });
        const json = await res.json();
        const db = await initDB();
        const tx = db.transaction(['entityData', 'meta'], 'readwrite');
        await tx.objectStore('entityData').put({ ...json, cachedAt: Date.now() }, legal_id);
        await tx.objectStore('meta').put(buildMetaRecord('entityData', meta, ENTITY_SOURCES));
        await tx.done;
        return json;
    } catch (err) {
        process.env.NODE_ENV !== 'production' && console.error('Error fetching entity data:', err);
        return null;
    }
}

export async function getEntityDataWithCache(legal_id, { force = false } = {}) {
    const db = await initDB();
    const server = await getServerMetadata({ force });
    const localMeta = await db.get('meta', 'entityData');
    const stale = force || isMetaStale(localMeta, server, ENTITY_SOURCES);

    if (stale) {
        await clearEntityData(db);
        return await fetchAndStoreEntityData(legal_id, server);
    }
    const cached = await loadEntityData(legal_id);
    if (cached) return cached;
    return await fetchAndStoreEntityData(legal_id, server);
}

/* =========================
 * Search Index — combined RC + VMI
 * ========================= */
const SEARCH_INDEX_SOURCES = ['rc', 'vmi'];

async function clearSearchIndex(db) {
    const tx = db.transaction(['searchIndex', 'meta'], 'readwrite');
    await tx.objectStore('searchIndex').clear();
    await tx.objectStore('meta').delete('searchIndex');
    await tx.done;
}

export async function fetchAndStoreSearchIndex(server) {
    try {
        const meta = server ?? await getServerMetadata();
        const res = await fetch(`${API_BASE}/search_index`, { cache: 'no-store' });
        const data = await res.json();

        const db = await initDB();
        const tx = db.transaction(['searchIndex', 'meta'], 'readwrite');
        const store = tx.objectStore('searchIndex');
        await store.clear();

        for (const row of data) {
            const legalIdNum = Number(row.legal_id);
            if (!Number.isFinite(legalIdNum)) continue;
            await store.put({ legal_id: legalIdNum, entity_name: row.entity_name });
        }
        await tx.objectStore('meta').put(buildMetaRecord('searchIndex', meta, SEARCH_INDEX_SOURCES));
        await tx.done;
        return data;
    } catch (err) {
        process.env.NODE_ENV !== 'production' && console.error('Error fetching search index:', err);
        return null;
    }
}

export async function getSearchIndexWithCache({ force = false } = {}) {
    const db = await initDB();
    const server = await getServerMetadata({ force });
    const localMeta = await db.get('meta', 'searchIndex');
    const stale = force || isMetaStale(localMeta, server, SEARCH_INDEX_SOURCES);

    if (stale) {
        await clearSearchIndex(db);
        await fetchAndStoreSearchIndex(server);
    }

    const all = await db.getAll('searchIndex');
    const result = {};
    for (const row of all) {
        if (row?.legal_id != null) result[row.legal_id] = row.entity_name;
    }
    return result;
}

/**
 * Prefix search by entity name via the 'entity_name' index.
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

    for await (const cursor of index.iterate()) {
        const name = (cursor.value?.entity_name || '').toLowerCase();
        if (name.startsWith(lower)) {
            results.push(cursor.value);
            if (results.length >= limit) break;
        }
    }
    return results;
}

export async function getAllSearchEntries() {
    const db = await initDB();
    return db.getAll('searchIndex');
}

/* =========================
 * Search history (local-only, not subject to server invalidation)
 * ========================= */
export async function addToSearchHistory(entry, max = 5) {
    const db = await initDB();
    const tx = db.transaction('searchHistory', 'readwrite');
    const store = tx.objectStore('searchHistory');
    await store.put({ ...entry, updatedAt: Date.now() });

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

/* =========================
 * Legacy compatibility
 * ========================= */

/** @deprecated Freshness is now driven by server metadata, not local TTL. */
export function isStale() {
    return true;
}

/** @deprecated Use `fetchAndStoreIndexData` which writes meta atomically. */
export async function saveIndexDataByYear(dataArray) {
    const server = await getServerMetadata();
    const db = await initDB();
    await writeIndexData(db, dataArray, server);
}

/** @deprecated Use `fetchAndStoreMunicipalityData`. */
export async function saveMunicipalityData(municipality, value) {
    const db = await initDB();
    return db.put('municipalityData', { ...value, cachedAt: Date.now() }, municipality);
}

/** @deprecated Use `fetchAndStoreEntityData`. */
export async function saveEntityData(legal_id, value) {
    const db = await initDB();
    return db.put('entityData', { ...value, cachedAt: Date.now() }, legal_id);
}
