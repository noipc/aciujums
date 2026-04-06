const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://gplb8fov1k.execute-api.eu-central-1.amazonaws.com/api').replace(/\/$/, '');
import EntityClient from './EntityClient';

async function fetchEntityData(legal_id) {
    try {
        const res = await fetch(
            `${API_BASE}/entity_data?legal_id=${legal_id}`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { legal_id } = await params;
    if (!/^\d{1,15}$/.test(legal_id)) return { title: 'Organizacija' };
    const data = await fetchEntityData(legal_id);
    if (!data) return { title: 'Organizacija' };
    const name = data.info[0]?.ja_pavadinimas ?? legal_id;
    return {
        title: name,
        description: `1,2% GPM paramos gavimo istorija ir bendra informacija apie organizaciją ${name} (įmonės kodas: ${legal_id}).`,
    };
}

export default async function EntityPage({ params }) {
    const { legal_id } = await params;
    const data = /^\d{1,15}$/.test(legal_id) ? await fetchEntityData(legal_id) : null;
    return <EntityClient initialData={data} />;
}
