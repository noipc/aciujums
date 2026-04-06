'use client';

import { useState, useEffect, useMemo } from 'react';
import { YearContext } from '../lib/yearContext';
import { saveIndexDataByYear } from '../lib/indexedDB';

export default function YearProvider({ children, initialYear, initialData }) {
    const [year, setYear] = useState(initialYear);

    const availableYears = useMemo(() => {
        if (!initialData || initialData.length === 0) return [];
        return [...new Set(initialData.map((d) => d.year))].sort((a, b) => a - b);
    }, [initialData]);

    // Persist server-fetched data to IndexedDB in background (non-blocking)
    useEffect(() => {
        if (initialData && initialData.length > 0) {
            saveIndexDataByYear(initialData).catch(() => {});
        }
    }, [initialData]);

    return (
        <YearContext.Provider value={{ year, setYear, data: initialData || [], availableYears }}>
            {children}
        </YearContext.Provider>
    );
}
