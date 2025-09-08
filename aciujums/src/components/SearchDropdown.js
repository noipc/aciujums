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

        let cancelled = false;

        if (query.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        async function loadSuggestions() {
            const db = await initDB();
            const tx = db.transaction('searchIndex');
            const store = tx.objectStore('searchIndex');

            const prefix = query.trim();
            const nameIndex = store.index('entity_name');
            const nameRange = IDBKeyRange.bound(prefix, prefix + '\uffff');
            const nameMatches = await nameIndex.getAll(nameRange, 5);

            let idMatches = [];
            if (/^\d+$/.test(prefix) && prefix.length >= 3) {

                const LEGAL_ID_DIGITS = 9;
                const p = prefix.slice(0, LEGAL_ID_DIGITS);

                const exp = Math.max(0, LEGAL_ID_DIGITS - p.length);
                const scale = Math.pow(10, exp);
                const lower = Number(p) * scale;              // inclusive
                const upper = (Number(p) + 1) * scale;        // exclusive
                
                const keyRange = IDBKeyRange.bound(lower, upper, false, true);
                idMatches = await store.getAll(keyRange, 5);

            }  else if (/^\d+$/.test(prefix) && prefix.length === 9) {
                // Optional: also allow exact hit when user typed full id
                const exact = await store.get(Number(prefix));
                if (exact) idMatches = [exact];
            }

            // dedupe (prefer exact id first)
            const unique = new Map();
            [...idMatches, ...nameMatches].forEach(entry => {
                if (entry && entry.legal_id != null) unique.set(entry.legal_id, entry);
            });

            if (!cancelled) setSuggestions(Array.from(unique.values()).slice(0, 5));
        }

        loadSuggestions();

        return () => { cancelled = true; };

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
                    id="searchInput"
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
