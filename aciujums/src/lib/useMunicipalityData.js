import { useState, useEffect } from 'react';
import { loadMunicipalityData, fetchAndStoreMunicipalityData } from '@/lib/indexedDB';

export function useMunicipalityData(municipality, year) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const cachedData = await loadMunicipalityData(municipality);
                if (cachedData && cachedData.latestYear === year) {
                    setData(cachedData.data || []);
                } else {
                    const apiData = await fetchAndStoreMunicipalityData(municipality, year);
                    setData(apiData?.data || []);
                }
            } catch {
                setData([]);
            } finally {
                setLoading(false);
            }
        }

        if (municipality && year) {
            loadData();
        }
    }, [municipality, year]);

    return { data, loading };
}