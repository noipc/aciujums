// lib/miniSearchClient.js
// Singleton MiniSearch instance for client-side entity search.
// - Hydrates documents from IndexedDB (which is refreshed monthly via
//   getSearchIndexWithCache).
// - Caches the serialized MiniSearch index in IndexedDB ("meta" store) to
//   avoid re-indexing on every page load.

'use client';

import MiniSearch from 'minisearch';
import {
    initDB,
    getSearchIndexWithCache,
    getAllSearchEntries,
} from './indexedDB';

const MINI_SEARCH_OPTIONS = {
    idField: 'legal_id',
    fields: ['entity_name'],
    storeFields: ['legal_id', 'entity_name'],
    searchOptions: {
        fuzzy: 0.2,
        prefix: true,
    },
};

// Module-level singletons so the index is built only once per page load.
let miniSearchInstance = null;
let buildPromise = null;

async function loadSerializedIndex() {
    try {
        const db = await initDB();
        const meta = await db.get('meta', 'searchIndex');
        const serialized = await db.get('meta', 'miniSearchIndex');
        if (!meta?.cachedAt || !serialized?.value) return null;
        // The serialized index must be at least as new as the underlying data.
        // Underlying `meta.searchIndex` is bumped whenever the RC/VMI server
        // stamps advance (see indexedDB.fetchAndStoreSearchIndex), so this
        // comparison transitively respects dual-source invalidation.
        if (serialized.cachedAt < meta.cachedAt) return null;
        return serialized.value;
    } catch {
        return null;
    }
}

async function saveSerializedIndex(json) {
    try {
        const db = await initDB();
        await db.put('meta', {
            key: 'miniSearchIndex',
            value: json,
            cachedAt: Date.now(),
        });
    } catch {
        // Non-fatal: we can rebuild next time.
    }
}

async function buildIndex() {
    // 1. Ensure the underlying IndexedDB search data is hydrated (monthly refresh).
    await getSearchIndexWithCache();

    // 2. Try to load a previously serialized MiniSearch index.
    const serialized = await loadSerializedIndex();
    if (serialized) {
        try {
            return MiniSearch.loadJSON(serialized, MINI_SEARCH_OPTIONS);
        } catch {
            // Fall through and rebuild from raw documents.
        }
    }

    // 3. Build the MiniSearch index from the IndexedDB documents.
    const docs = await getAllSearchEntries();
    const ms = new MiniSearch(MINI_SEARCH_OPTIONS);
    if (Array.isArray(docs) && docs.length > 0) {
        ms.addAll(
            docs
                .filter((d) => d && d.legal_id != null && d.entity_name)
                .map((d) => ({ legal_id: d.legal_id, entity_name: d.entity_name }))
        );
        // Persist serialized index for next page load.
        saveSerializedIndex(JSON.stringify(ms));
    }
    return ms;
}

/**
 * Get (and lazily create) the shared MiniSearch instance.
 */
export async function getMiniSearch() {
    if (miniSearchInstance) return miniSearchInstance;
    if (!buildPromise) {
        buildPromise = buildIndex().then((ms) => {
            miniSearchInstance = ms;
            return ms;
        });
    }
    return buildPromise;
}

/**
 * Run a MiniSearch query against the cached entity_name index.
 * Returns an array of { legal_id, entity_name } (capped to `limit`).
 *
 * The 3-character minimum is enforced here so all UI callers behave the same.
 */
export async function searchEntities(query, limit = 5) {
    const q = (query ?? '').trim();
    if (q.length < 3) return [];
    const ms = await getMiniSearch();
    const hits = ms.search(q);
    return hits.slice(0, limit).map((h) => ({
        legal_id: h.legal_id,
        entity_name: h.entity_name,
    }));
}
