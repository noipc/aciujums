import { useState, useEffect } from 'react';
import { loadEntityData, fetchAndStoreEntityData } from './indexedDB';

export function useEntityData(legal_id) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const cachedData = await loadEntityData(legal_id);
            if (cachedData) {
                setData(cachedData);
            } else {
                const apiData = await fetchAndStoreEntityData(legal_id);
                setData(apiData);
            }
            setLoading(false);
        }
        if (legal_id) {
            loadData();
        }
    }, [legal_id]);

    return { data, loading };
}