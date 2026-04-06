import dynamic from 'next/dynamic';
import { municipalityMap } from '@/lib/municipalityMap';

const MunicipalityClient = dynamic(() => import('./MunicipalityClient'));

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://gplb8fov1k.execute-api.eu-central-1.amazonaws.com/api').replace(/\/$/, '');

async function fetchMunicipalitySummary(municipality) {
    try {
        const res = await fetch(`${API_BASE}/municipality_data?municipality=${municipality}`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { municipality } = await params;
    const name = municipalityMap[municipality];
    if (!name) return { title: 'Savivaldybė' };
    return {
        title: name,
        description: `${name} savivaldybės 1,2% GPM paramos statistika: surinktos lėšos, teikėjų ir gavėjų skaičius pagal metus.`,
        openGraph: { title: name, description: `${name} savivaldybės 1,2% GPM paramos statistika.` },
    };
}

export default async function MunicipalityPage({ params }) {
    const { municipality } = await params;
    const name = municipalityMap[municipality];
    const summary = await fetchMunicipalitySummary(municipality);

    return (
        <>
            {/* SSR content for crawlers */}
            {name && (
                <div className="sr-only">
                    <h1>{name}</h1>
                    {summary && (
                        <dl>
                            <dt>Savivaldybė</dt><dd>{name}</dd>
                        </dl>
                    )}
                </div>
            )}
            <MunicipalityClient />
        </>
    );
}
