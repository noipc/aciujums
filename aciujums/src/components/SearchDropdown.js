'use client';

import { useEffect, useRef, useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import { initDB, getSearchIndexWithCache, getAllSearchEntries } from '@/lib/indexedDB';

export default function SearchDropdown() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [history, setHistory] = useState([]);
    // Keep numeric-id search entries in memory (small — only used for digit queries)
    const [searchEntries, setSearchEntries] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const inputRef = useRef();
    const listId = useId();

    const allItems = suggestions.length > 0 ? suggestions
        : (query.trim().length < 3 ? history : []);
    const isOpen = suggestions.length > 0 || history.length > 0 || query.trim().length >= 3;

    useEffect(() => {
        // Pre-warm the search index cache; keep full list only for numeric-ID searches
        getSearchIndexWithCache()
            .then(() => getAllSearchEntries())
            .then(setSearchEntries)
            .catch(() => {});
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (query.trim().length < 3) { setSuggestions([]); setActiveIndex(-1); return; }

        const debounce = setTimeout(() => {
            const prefix = query.trim();
            const lower = prefix.toLowerCase().normalize('NFC');
            let results;
            if (/^\d+$/.test(prefix)) {
                results = searchEntries.filter((e) => String(e.legal_id).startsWith(prefix)).slice(0, 5);
            } else {
                results = searchEntries
                    .filter((e) => e.entity_name.toLowerCase().normalize('NFC').startsWith(lower))
                    .slice(0, 5);
            }
            if (!cancelled) { setSuggestions(results); setActiveIndex(-1); }
        }, 200);

        return () => { cancelled = true; clearTimeout(debounce); };
    }, [query, searchEntries]);

    async function loadSearchHistory() {
        const db = await initDB();
        const tx = db.transaction('searchHistory');
        const store = tx.objectStore('searchHistory');
        const all = await store.getAll();
        const sorted = all.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
        setHistory(sorted);
    }

    function handleSelect(result) {
        setQuery('');
        setSuggestions([]);
        setHistory([]);
        setActiveIndex(-1);
        router.push(`/organizacijos/${result.legal_id}`);
        initDB().then(async (db) => {
            const tx = db.transaction('searchHistory', 'readwrite');
            const store = tx.objectStore('searchHistory');
            await store.put({ ...result, updatedAt: Date.now() });
            const all = await store.getAll();
            const sorted = all.sort((a, b) => b.updatedAt - a.updatedAt);
            for (const entry of sorted.slice(5)) { await store.delete(entry.legal_id); }
            await tx.done;
        }).catch(() => {});
    }

    function handleKeyDown(e) {
        if (!isOpen) return;
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
            setQuery('');
            setSuggestions([]);
            setHistory([]);
            setActiveIndex(-1);
        }
    }

    function handleWrapperBlur() {
        setTimeout(() => {
            if (wrapperRef.current && !wrapperRef.current.contains(document.activeElement)) {
                setQuery('');
                setSuggestions([]);
                setHistory([]);
                setActiveIndex(-1);
            }
        }, 100);
    }

    function handleWrapperFocus() {
        if (query.trim().length < 3) loadSearchHistory();
    }

    return (
        <div
            className="search-wrapper"
            ref={wrapperRef}
            onBlur={handleWrapperBlur}
            onFocus={handleWrapperFocus}
            tabIndex={-1}
        >
            <label htmlFor="searchInput" className="sr-only">Ieškoti organizacijų</label>
            <div className={`search-input-wrapper${isOpen ? ' open' : ''}`}>
                <input
                    id="searchInput"
                    ref={inputRef}
                    type="text"
                    placeholder="Ieškoti organizacijų..."
                    className="search-input"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-autocomplete="list"
                    aria-controls={listId}
                    aria-activedescendant={activeIndex >= 0 ? `${listId}-item-${activeIndex}` : undefined}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {isOpen && (
                <div className="search-dropdown-card">
                    <ul id={listId} role="listbox" className="flex flex-col py-2">
                        {suggestions.map((r, i) => (
                            <li
                                key={r.legal_id}
                                id={`${listId}-item-${i}`}
                                role="option"
                                aria-selected={i === activeIndex}
                                onClick={() => handleSelect(r)}
                                className={`px-4 py-[5px] cursor-pointer hover:bg-gray-50${i === activeIndex ? ' bg-gray-50' : ''}`}
                            >
                                {r.entity_name} ({r.legal_id})
                            </li>
                        ))}

                        {query.trim().length >= 3 && suggestions.length === 0 && (
                            <li role="option" aria-selected="false" className="px-4 py-[5px] text-gray-400">Rezultatų nėra</li>
                        )}

                        {suggestions.length === 0 && query.trim().length < 3 && history.length > 0 && (
                            <>
                                <span className="search-history-label px-4 pt-2 pb-1">Ankstesnės paieškos</span>
                                {history.map((r, i) => (
                                    <li
                                        key={r.legal_id}
                                        id={`${listId}-item-${i}`}
                                        role="option"
                                        aria-selected={i === activeIndex}
                                        onClick={() => handleSelect(r)}
                                        className={`px-4 py-[5px] cursor-pointer hover:bg-gray-50${i === activeIndex ? ' bg-gray-50' : ''}`}
                                    >
                                        {r.entity_name} ({r.legal_id})
                                    </li>
                                ))}
                            </>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
