'use client';
import Link from 'next/link';
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

            if (count === 1 || (mod10 === 1 && mod100 !== 11)) {
                return 'rezultatas';
            } else if ([2, 3, 4, 5, 6, 7, 8, 9].includes(mod10) && !(mod100 >= 11 && mod100 <= 19)) {
                return 'rezultatai';
            } else {
                return 'rezultatų';
            }
        }

        async function fetchResults() {
            try {
                const res = await fetch(`https://uv6lt2g8i3.execute-api.eu-central-1.amazonaws.com/api/search?q=${encodeURIComponent(searchTerm)}`);
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
        <div className="container pt-5 mt-10">
            <form id="ajSearchForm" action="/paieska" className="form-inline nav-form mb-5" style={{ display: 'flex' }}>
                <div className="d-flex align-items-center search-input-wrapper search-input-wrapper--wider">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        name="ieskoti"
                        id="searchFormInput"
                        className="search-input"
                        placeholder="Ieškoti organizcijų..."
                        defaultValue={searchTerm}
                    />
                    <i id="searchInputCloseBtn" className="d-inline-block fas fa-times"></i>
                </div>
                <button id="searchPageLink" className="btn btn-primary btn-primary--right-half-round btn-search" type="submit">
                    Ieškoti
                </button>
            </form>

            <div id="searchResults">
                <span id="searchMetaData" className="d-block mb-4 text-muted">{meta}</span>
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