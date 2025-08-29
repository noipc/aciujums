import { useState, useEffect } from 'react';
import { loadMunicipalityData, fetchAndStoreMunicipalityData } from '@/lib/indexedDB';

export function useMunicipalityData(municipality, year) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            const cachedData = await loadMunicipalityData(municipality);

            if (cachedData && cachedData.latestYear === year) {
                // If cached data matches the selected year, use it
                setData(cachedData.data || []);
            } else {
                // Otherwise, fetch fresh data and overwrite
                const apiData = await fetchAndStoreMunicipalityData(municipality, year);
                setData(apiData?.data || []);
            }

            setLoading(false);
        }

        if (municipality && year) {
            loadData();
        }
    }, [municipality, year]);

    return { data, loading };
}