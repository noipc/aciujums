import { openDB } from 'idb';

export async function initDB() {
    return openDB('MyAppDB', 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('indexDataByYear')) {
                db.createObjectStore('indexDataByYear', { keyPath: 'year' });
            }
            if (!db.objectStoreNames.contains('municipalityData')) {
                db.createObjectStore('municipalityData');
            }
            if (!db.objectStoreNames.contains('entityData')) {
                db.createObjectStore('entityData');
            }
        },
    });
}

/* ===== Index Data Functions ===== */

// Save index_data grouped by year.
export async function saveIndexDataByYear(dataArray) {
    const db = await initDB();
    const tx = db.transaction('indexDataByYear', 'readwrite');
    const store = tx.objectStore('indexDataByYear');

    const groupedByYear = {};
    dataArray.forEach((entry) => {
        if (!groupedByYear[entry.year]) groupedByYear[entry.year] = [];
        groupedByYear[entry.year].push(entry);
    });

    for (const year in groupedByYear) {
        await store.put({ year: parseInt(year), data: groupedByYear[year] });
    }
    await tx.done;
}

// Retrieve all index data (from all years)
export async function getAllIndexData() {
    const db = await initDB();
    return db.getAll('indexDataByYear');
}

// Fetch index_data from API and store it in IndexedDB.
export async function fetchAndStoreIndexData() {
    try {
        const response = await fetch('https://uv6lt2g8i3.execute-api.eu-central-1.amazonaws.com/api/index_data');
        const json = await response.json();
        // Assuming json.data is an array of entries
        await saveIndexDataByYear(json.data);
        return json.data;
    } catch (error) {
        console.error('Error fetching index data:', error);
        return [];
    }
}

/* ===== Municipality Data Functions ===== */

// Save municipality data by municipality key.
export async function saveMunicipalityData(municipality, value) {
    const db = await initDB();
    return db.put('municipalityData', value, municipality);
}

// Load municipality data by municipality key.
export async function loadMunicipalityData(municipality) {
    const db = await initDB();
    return db.get('municipalityData', municipality);
}

// Fetch municipality data from API and store it.
export async function fetchAndStoreMunicipalityData(municipality, year) {
    try {
        const response = await fetch(
            `https://uv6lt2g8i3.execute-api.eu-central-1.amazonaws.com/api/municipality_data?municipality=${municipality}&year=${year}`
        );
        const json = await response.json();
        await saveMunicipalityData(municipality, json);
        return json;
    } catch (error) {
        console.error('Error fetching municipality data:', error);
        return null;
    }
}

/* ===== Entity Data Functions ===== */

// Save entity data by legal_id.
export async function saveEntityData(legal_id, value) {
    const db = await initDB();
    return db.put('entityData', value, legal_id);
}

// Load entity data by legal_id.
export async function loadEntityData(legal_id) {
    const db = await initDB();
    return db.get('entityData', legal_id);
}

// Fetch entity data from API and store it.
export async function fetchAndStoreEntityData(legal_id) {
    try {
        const response = await fetch(`https://uv6lt2g8i3.execute-api.eu-central-1.amazonaws.com/api/entity_data?legal_id=${legal_id}`);
        const json = await response.json();
        await saveEntityData(legal_id, json);
        return json;
    } catch (error) {
        console.error('Error fetching entity data:', error);
        return null;
    }
}

export async function getAvailableYears() {
    const db = await initDB();
    const store = db.transaction('indexDataByYear').objectStore('indexDataByYear');
    const allEntries = await store.getAll();
    return allEntries.map(entry => entry.year).sort(); // returns [2017, 2018, ...]
}