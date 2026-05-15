const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://gplb8fov1k.execute-api.eu-central-1.amazonaws.com/api').replace(/\/$/, '');
const INDEX_DATA_URL = `${API_BASE}/index_data`;

// Always fetch fresh from the API on the server; freshness is governed by
// the dual-source metadata stamps (see /metadata) rather than Next.js's
// data cache. Routes consuming this helper must also export
// `dynamic = 'force-dynamic'` so the request runs at request time.
export async function fetchIndexData() {
    try {
        const res = await fetch(INDEX_DATA_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return json.data || [];
    } catch {
        return [];
    }
}
