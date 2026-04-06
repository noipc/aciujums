import { unstable_cache } from 'next/cache';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://gplb8fov1k.execute-api.eu-central-1.amazonaws.com/api').replace(/\/$/, '');
const INDEX_DATA_URL = `${API_BASE}/index_data`;

async function _fetchIndexData() {
    try {
        const res = await fetch(INDEX_DATA_URL, { next: { revalidate: 86400 } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return json.data || [];
    } catch {
        return [];
    }
}

// Cache at the Next.js data-cache layer for 24 hours across all requests
export const fetchIndexData = unstable_cache(_fetchIndexData, ['index-data'], { revalidate: 86400 });
