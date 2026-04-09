'use client';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMunicipalityData } from '@/lib/useMunicipalityData';
import CustomDropdown from '@/components/CustomDropdown';
import LoadingSpinner from './LoadingSpinner';


export default function EntityTable({ municipality, initialYear, availableYears }) {

    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [localYear, setLocalYear]     = useState(initialYear);
    const [filterYear, setFilterYear]   = useState(localYear);
    const itemsPerPage                  = 100;

    const { data, loading } = useMunicipalityData(municipality, localYear);

    const [filterOrderValue, setFilterOrderValue] = useState('a_z');

    const sortingOptions = [
        { value: 'a_z', label: 'Nuo A iki Z' },
        { value: 'z_a', label: 'Nuo Z iki A' },
        { value: 'low_high', label: 'Maž. suma → Didž. suma' },
        { value: 'high_low', label: 'Didž. suma → Maž. suma' },
    ];

    useEffect(() => {
        if (filterYear) {
            setLocalYear(filterYear);
            setCurrentPage(1);
        }
    }, [filterYear]);

    const filteredEntities = useMemo(() => {
        if (!data) return [];
        const sortedEntities = [...data];
        if (filterOrderValue === 'a_z') {
            sortedEntities.sort((a, b) => a.entity_name.localeCompare(b.entity_name));
        } else if (filterOrderValue === 'z_a') {
            sortedEntities.sort((a, b) => b.entity_name.localeCompare(a.entity_name));
        } else if (filterOrderValue === 'low_high') {
            sortedEntities.sort((a, b) => a.total_funds - b.total_funds);
        } else if (filterOrderValue === 'high_low') {
            sortedEntities.sort((a, b) => b.total_funds - a.total_funds);
        }
        return sortedEntities;
    }, [data, filterOrderValue]);

    const paginatedEntities = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredEntities.slice(start, start + itemsPerPage);
    }, [filteredEntities, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredEntities.length / itemsPerPage);

    if (!data || loading) return <LoadingSpinner />;

    return (
        <div>
            <div className="filters-container">
                <div className="filter-wrapper flex flex-wrap justify-start items-center mt-2 mb-2">
                    <div className="inline-block mr-4 pb-1">
                        <label className="inline-block"><strong>Metai:</strong></label>
                        <CustomDropdown
                            value={availableYears.map(yr => ({ value: yr, label: yr })).find(option => option.value === filterYear)}
                            options={availableYears.map((yr) => ({ value: yr, label: yr }))}
                            onChange={(selectedOption) => {
                                setFilterYear(selectedOption.value);
                                setCurrentPage(1);
                            }}
                            listClassName="year-list"
                        />
                    </div>
                    <div className="inline-block mr-4 pb-1">
                        <label className="inline-block"><strong>Rikiuoti nuo:</strong></label>
                        <CustomDropdown
                            value={sortingOptions.find(option => option.value === filterOrderValue)}
                            options={sortingOptions}
                            onChange={(selectedOption) => setFilterOrderValue(selectedOption.value)}
                            listClassName="wide-field"
                            isInputWide="True"
                        />
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table id="entityListTable" className="table table-striped">
                    <thead>
                        <tr>
                            <th>JA Kodas</th>
                            <th>Organizacija</th>
                            <th>Teikėjų skaičius</th>
                            <th>Suma, EUR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEntities.map((entity) => (
                            <tr
                                key={entity.legal_id}
                                style={{ cursor: 'pointer' }}
                                onClick={() => router.push(`/organizacijos/${entity.legal_id}`)}
                            >
                                <td>{entity.legal_id}</td>
                                <td><Link href={`/organizacijos/${entity.legal_id}`}>{entity.entity_name}</Link></td>
                                <td>{entity.total_funders}</td>
                                <td>{entity.total_funds.toLocaleString('lt-LT', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center mb-2">
                <div className="pagination items-center mt-6">
                    <button className="btn-circle" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z"/>
                        </svg>
                    </button>
                    <span className="mx-2">{currentPage} iš {totalPages}</span>
                    <button className="btn-circle" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
