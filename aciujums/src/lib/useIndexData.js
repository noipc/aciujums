import { useState, useEffect } from 'react';
import { getAllIndexData, fetchAndStoreIndexData } from './indexedDB';

export function useIndexData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const cachedData = await getAllIndexData();
            if (cachedData && cachedData.length > 0) {
                // Merge the arrays from each year.
                const merged = cachedData.flatMap((entry) => entry.data);
                setData(merged);
            } else {
                const apiData = await fetchAndStoreIndexData();
                setData(apiData);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    return { data, loading };
}