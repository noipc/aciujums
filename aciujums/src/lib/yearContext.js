import { createContext } from 'react';

export const YearContext = createContext({
    year: null,
    setYear: () => {},
    data: [],
    availableYears: [],
});
