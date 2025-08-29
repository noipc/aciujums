import { useMemo, useState, useEffect } from 'react';
import { useMunicipalityData } from '@/lib/useMunicipalityData'; // already exists
import CustomDropdown from '@/components/CustomDropdown';


export default function EntityTable({ municipality, initialYear, availableYears }) {

    const [currentPage, setCurrentPage] = useState(1);
    const [localYear, setLocalYear]     = useState(initialYear);
    const [filterYear, setFilterYear]   = useState(localYear);
    const itemsPerPage                  = 100;

    console.log(municipality, localYear)

    const { data, loading } = useMunicipalityData(municipality, localYear);

    const [filterOrderValue, setFilterOrderValue] = useState('a_z');

    const sortingOptions = [
        { value: 'a_z', label: 'Nuo A iki Z' },
        { value: 'z_a', label: 'Nuo Z iki A' },
        { value: 'low_high', label: 'Maž. suma → Didž. suma' },
        { value: 'high_low', label: 'Didž. suma → Maž. suma' },
    ];

    //When filterYear changes, update the localYear to trigger re-fetch.
    useEffect(() => {
        if (filterYear) {
            setLocalYear(filterYear);
            setCurrentPage(1);
        }
    }, [filterYear]);

    const filteredEntities = useMemo(() => {
        if (!data) return [];
        let entities = data;
        // Here, data is assumed to be for the selected year (localYear)
        // Sort based on filterOrder.
        const sortedEntities = [...entities];
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

    if (!data || loading) return <div>Loading table...</div>;

    return (
        <div>
            <div className="filters-container">
                <div className="filter-wrapper d-flex flex-wrap justify-content-start align-items-center mt-2 mb-2">
                    <div className="d-inline-block mr-3 pb-1">
                        <label className="d-inline-block"><strong>Metai:</strong></label>
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
                    <div className="d-inline-block mr-3 pb-1">
                        <label className="d-inline-block"><strong>Rikiuoti nuo:</strong></label>
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
            <div className="table-responsive">
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
                                onClick={() => window.location.href = `/organizacijos/${entity.legal_id}`}
                            >
                                <td>{entity.legal_id}</td>
                                <td>{entity.entity_name}</td>
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

            {/* Pagination Controls */}
            <div className="d-flex justify-content-center">
                <div className="pagination align-items-center mt-4">
                    <button className="btn-circle" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}><i className="fa fa-chevron-left"></i></button>
                    <span className="mx-2">{currentPage} iš {totalPages}</span>
                    <button className="btn-circle" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}><i className="fa fa-chevron-right"></i></button>
                </div>
            </div>
        </div>
    );
}