'use client';
import Link from 'next/link';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://gplb8fov1k.execute-api.eu-central-1.amazonaws.com/api').replace(/\/$/, '');
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SearchClient() {
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get('ieskoti')?.trim() || '';
    const [results, setResults] = useState([]);
    const [meta, setMeta] = useState('');

    useEffect(() => {
        if (!searchTerm) return;

        function getRezultatasWord(count) {
            const mod10 = count % 10;
            const mod100 = count % 100;
            if (count === 1 || (mod10 === 1 && mod100 !== 11)) return 'rezultatas';
            if ([2, 3, 4, 5, 6, 7, 8, 9].includes(mod10) && !(mod100 >= 11 && mod100 <= 19)) return 'rezultatai';
            return 'rezultatų';
        }

        async function fetchResults() {
            try {
                const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchTerm)}`);
                const data = await res.json();
                setResults(data);
                setMeta(`${data.length} ${getRezultatasWord(data.length)} pagal užklausą: "${searchTerm}"`);
            } catch (err) {
                console.error('Search failed', err);
                setMeta('Klaida vykdant paiešką');
                setResults([]);
            }
        }

        fetchResults();
    }, [searchTerm]);

    return (
        <div className="container pt-12 mt-10">
            <form id="ajSearchForm" action="/paieska" className="nav-form mb-12" style={{ display: 'flex' }}>
                <div className="flex items-center search-input-wrapper search-input-wrapper--wider">
                    <svg className="icon-search" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input
                        type="text"
                        name="ieskoti"
                        id="searchFormInput"
                        className="search-input"
                        placeholder="Ieškoti organizcijų..."
                        defaultValue={searchTerm}
                    />
                    <span id="searchInputCloseBtn" className="inline-block">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/>
                        </svg>
                    </span>
                </div>
                <button id="searchPageLink" className="btn-primary btn-primary--right-half-round btn-search" type="submit">
                    Ieškoti
                </button>
            </form>

            <div id="searchResults">
                <span id="searchMetaData" className="block mb-6 text-gray-500">{meta}</span>
                <ul aria-label="paieškos rezultatai">
                    {results.map((item) => (
                        <li key={item.legal_id}>
                            <Link href={`/organizacijos/${item.legal_id}`}>
                                {item.entity_name} ({item.legal_id})
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
