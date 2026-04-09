import { municipalityMap } from '@/lib/municipalityMap';
import { newsItems } from '@/lib/newsData';

const BASE_URL = 'https://www.aciujums.lt';

export default function sitemap() {
    const staticRoutes = [
        { url: BASE_URL, priority: 1.0, changeFrequency: 'weekly' },
        { url: `${BASE_URL}/apie-mus`, priority: 0.5, changeFrequency: 'yearly' },
        { url: `${BASE_URL}/naudinga-informacija`, priority: 0.5, changeFrequency: 'yearly' },
        { url: `${BASE_URL}/naujienos`, priority: 0.6, changeFrequency: 'monthly' },
    ];

    const municipalityRoutes = Object.keys(municipalityMap).map((slug) => ({
        url: `${BASE_URL}/savivaldybes/${slug}`,
        priority: 0.7,
        changeFrequency: 'monthly',
    }));

    const newsRoutes = newsItems.map((item) => ({
        url: `${BASE_URL}/naujienos/${item.slug}`,
        priority: 0.6,
        changeFrequency: 'yearly',
    }));

    return [...staticRoutes, ...municipalityRoutes, ...newsRoutes];
}
