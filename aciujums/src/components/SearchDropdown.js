'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { initDB } from '@/lib/indexedDB';

export default function SearchDropdown() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [history, setHistory] = useState([]);
    const wrapperRef = useRef(null);
    const inputRef = useRef();

    useEffect(() => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        async function loadSuggestions() {
            const db = await initDB();
            const tx = db.transaction('searchIndex');
            const store = tx.objectStore('searchIndex');
            const nameIndex = store.index('name');
            const nameRange = IDBKeyRange.bound(query, query + '\uffff');
            const nameMatches = await nameIndex.getAll(nameRange, 5);

            const idIndex = store.index('legal_id');
            let idMatches = [];

            if (/^\d+$/.test(query)) {
                const idRange = IDBKeyRange.bound(query, query + '\uffff');
                idMatches = await idIndex.getAll(idRange, 5);
            }

            const combined = [...nameMatches, ...idMatches];
            const uniqueMap = new Map();
            combined.forEach(entry => uniqueMap.set(entry.legal_id, entry));
            setSuggestions(Array.from(uniqueMap.values()).slice(0, 5));
        }

        loadSuggestions();

    }, [query]);

    useEffect(() => {
        async function loadSearchHistory() {
            const db = await initDB();
            const tx = db.transaction('searchHistory');
            const store = tx.objectStore('searchHistory');
            const all = await store.getAll();
            // Sort by most recent (last updated)
            const sorted = all.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
            setHistory(sorted);
        }
        loadSearchHistory();
    }, []);

    async function handleSelect(result) {
        const db = await initDB();
        const tx = db.transaction('searchHistory', 'readwrite');
        const store = tx.objectStore('searchHistory');

        await store.put({ ...result, updatedAt: Date.now() });

        // Enforce a max of 5 entries by trimming excess
        const all = await store.getAll();
        const sorted = all.sort((a, b) => b.updatedAt - a.updatedAt);
        const excess = sorted.slice(5);
        for (const entry of excess) {
            await store.delete(entry.legal_id);
        }

        await tx.done;
        window.location.href = `/organizacijos/${result.legal_id}`;
    }

    function handleWrapperBlur(e) {
        // Wait a moment in case the user is clicking a dropdown item
        setTimeout(() => {
            if (wrapperRef.current && !wrapperRef.current.contains(document.activeElement)) {
                setQuery('');
                setSuggestions([]);
            }
        }, 100);
    };

    return (
        <div 
            className="search-wrapper"
            ref={wrapperRef}
            onBlur={handleWrapperBlur}
            onFocus={() => {}}
            tabIndex={-1}
        >
            <div className="search-input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ieškoti organizacijų..."
                    className="search-input"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
            </div>

            {(suggestions.length > 0 || history.length > 0) && (
                <div className="search-dropdown-card">
                    <ul className="d-block">
                        {suggestions.map((r) => (
                            <li className="d-block mb-1" key={r.legal_id} onClick={() => handleSelect(r)}>
                                {r.entity_name} ({r.legal_id})
                            </li>
                        ))}

                        {suggestions.length === 0 && history.length > 0 && (
                            <div>
                                <span className="info-name small font-weight-bold text-muted d-block mb-1 mt-2">Ankstesnės paieškos</span>
                                <ul className="d-block">
                                    {history.map((r) => (
                                        <li key={r.legal_id} onClick={() => handleSelect(r)} className="d-block mb-1">
                                            {r.entity_name} ({r.legal_id})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
