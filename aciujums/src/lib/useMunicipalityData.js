import { useState, useEffect } from 'react';
import { loadMunicipalityData, fetchAndStoreMunicipalityData } from './indexedDB';

export function useMunicipalityData(municipality, year) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const cachedData = await loadMunicipalityData(municipality);
            if (cachedData) {
                setData(cachedData);
            } else {
                const apiData = await fetchAndStoreMunicipalityData(municipality, year);
                setData(apiData);
            }
            setLoading(false);
        }
        if (municipality && year) {
            loadData();
        }
    }, [municipality, year]);

    return { data, loading };
}
