import { useState, useEffect } from 'react';
import { getMunicipalityDataWithCache } from '@/lib/indexedDB';

export function useMunicipalityData(municipality, year) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            setLoading(true);
            try {
                // Route every request through the dual-metadata cache so
                // VMI/RC server stamps drive invalidation (no local TTL).
                const result = await getMunicipalityDataWithCache(municipality, year);
                if (!cancelled) setData(result?.data || []);
            } catch {
                if (!cancelled) setData([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        if (municipality && year) {
            loadData();
        }

        return () => { cancelled = true; };
    }, [municipality, year]);

    return { data, loading };
}
