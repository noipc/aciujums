'use client';

import { useEffect, useRef, useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import { initDB, getAllSearchEntries, getSearchIndexWithCache, searchEntitiesByNamePrefix } from '@/lib/indexedDB';

export default function MobileSearchOverlay({ onClose }) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [history, setHistory] = useState([]);
    const [searchEntries, setSearchEntries] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef(null);
    const listId = useId();

    const allItems = suggestions.length > 0 ? suggestions : (query.trim().length < 3 ? history : []);
    const hasResults = suggestions.length > 0 || (query.trim().length < 3 && history.length > 0) || query.trim().length >= 3;

    useEffect(() => {
        inputRef.current?.focus();
        loadSearchHistory();
        getSearchIndexWithCache()
            .then(() => getAllSearchEntries())
            .then(setSearchEntries)
            .catch(() => {});
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (query.trim().length < 3) { setSuggestions([]); setActiveIndex(-1); return; }

        const debounce = setTimeout(async () => {
            const prefix = query.trim();
            try {
                let results;
                if (/^\d+$/.test(prefix)) {
                    results = searchEntries.filter((e) => String(e.legal_id).startsWith(prefix)).slice(0, 5);
                } else {
                    results = await searchEntitiesByNamePrefix(prefix, 5);
                    if (results.length === 0) {
                        const lower = prefix.toLowerCase().normalize('NFC');
                        results = searchEntries.filter((e) => e.entity_name.toLowerCase().normalize('NFC').includes(lower)).slice(0, 5);
                    }
                }
                if (!cancelled) { setSuggestions(results); setActiveIndex(-1); }
            } catch {
                if (!cancelled) { setSuggestions([]); setActiveIndex(-1); }
            }
        }, 200);

        return () => { cancelled = true; clearTimeout(debounce); };
    }, [query, searchEntries]);

    async function loadSearchHistory() {
        try {
            const db = await initDB();
            const tx = db.transaction('searchHistory');
            const store = tx.objectStore('searchHistory');
            const all = await store.getAll();
            setHistory(all.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5));
        } catch {}
    }

    function handleSelect(result) {
        onClose();
        router.push(`/organizacijos/${result.legal_id}`);
        initDB().then(async (db) => {
            const tx = db.transaction('searchHistory', 'readwrite');
            const store = tx.objectStore('searchHistory');
            await store.put({ ...result, updatedAt: Date.now() });
            const all = await store.getAll();
            const sorted = all.sort((a, b) => b.updatedAt - a.updatedAt);
            for (const entry of sorted.slice(5)) await store.delete(entry.legal_id);
            await tx.done;
        }).catch(() => {});
    }

    function handleKeyDown(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, -1));
        } else if (e.key === 'Enter' && activeIndex >= 0 && allItems[activeIndex]) {
            e.preventDefault();
            handleSelect(allItems[activeIndex]);
        } else if (e.key === 'Escape') {
            onClose();
        }
    }

    return (
        <div className="mobile-search-overlay" role="dialog" aria-modal="true" aria-label="Paieška">
            <div className="mobile-search-header">
                <label htmlFor="mobileSearchInput" className="sr-only">Ieškoti organizacijų</label>
                <div className="mobile-search-input-wrapper">
                    <input
                        id="mobileSearchInput"
                        ref={inputRef}
                        type="text"
                        placeholder="Ieškoti organizacijų..."
                        role="combobox"
                        aria-expanded={hasResults}
                        aria-autocomplete="list"
                        aria-controls={listId}
                        aria-activedescendant={activeIndex >= 0 ? `${listId}-item-${activeIndex}` : undefined}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <button
                    type="button"
                    className="btn-circle"
                    onClick={onClose}
                    aria-label="Uždaryti paiešką"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/>
                    </svg>
                </button>
            </div>

            {hasResults && (
                <ul id={listId} role="listbox" className="mobile-search-results">
                    {suggestions.map((r, i) => (
                        <li
                            key={r.legal_id}
                            id={`${listId}-item-${i}`}
                            role="option"
                            aria-selected={i === activeIndex}
                            onMouseDown={() => handleSelect(r)}
                            className={`mobile-search-result-item${i === activeIndex ? ' active' : ''}`}
                        >
                            <span className="mobile-search-result-name">{r.entity_name}</span>
                            <span className="mobile-search-result-id">{r.legal_id}</span>
                        </li>
                    ))}

                    {query.trim().length >= 3 && suggestions.length === 0 && (
                        <li role="option" aria-selected="false" className="mobile-search-result-item mobile-search-no-results">
                            Rezultatų nėra
                        </li>
                    )}

                    {suggestions.length === 0 && query.trim().length < 3 && history.length > 0 && (
                        <>
                            <li className="search-history-label px-4 pt-3 pb-1" aria-hidden="true">Ankstesnės paieškos</li>
                            {history.map((r, i) => (
                                <li
                                    key={r.legal_id}
                                    id={`${listId}-item-${i}`}
                                    role="option"
                                    aria-selected={i === activeIndex}
                                    onMouseDown={() => handleSelect(r)}
                                    className={`mobile-search-result-item${i === activeIndex ? ' active' : ''}`}
                                >
                                    <span className="mobile-search-result-name">{r.entity_name}</span>
                                    <span className="mobile-search-result-id">{r.legal_id}</span>
                                </li>
                            ))}
                        </>
                    )}
                </ul>
            )}
        </div>
    );
}
