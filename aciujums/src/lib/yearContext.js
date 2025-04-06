import { createContext, useState } from 'react';

export const YearContext = createContext({
    year: null,
    setYear: () => {}
});