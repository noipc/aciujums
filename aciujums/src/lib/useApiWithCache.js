import { useEffect, useState } from 'react';
import axios from 'axios';
import { getDB, getAllIndexData, loadFromIndexedDb, saveToIndexedDb  } from './indexedDB';

export function useApiWithCache({ storeName, key, url, fetchFunction }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const cachedData = await loadFromIndexedDb(storeName, key);
            if (cachedData) {
                setData(cachedData);
                setLoading(false);
            } else {
                const res = await axios.get(url);
                await saveToIndexedDb(storeName, key, res.data);
                setData(res.data);
                setLoading(false);
            }
        }
        fetchData();
    }, [storeName, key, url]);

    return { data, loading };
}