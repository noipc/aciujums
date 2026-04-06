import Link from 'next/link';
import { newsItems } from '@/lib/newsData';

export const metadata = {
    title: 'Naujienos',
    description: 'Naujienos apie 1,2% GPM paramos sistemą ir NVO sektorių Lietuvoje.',
};

export default function NewsPage() {
    const sortedNews = [...newsItems].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="container pt-12 mt-12">
            <h2 className="title mb-12">Naujienos</h2>
            <div className="flex flex-wrap">
                <div className="w-full mb-4">
                    <ul className="news-list">
                        {sortedNews.map((item) => (
                            <li key={item.slug} className="mb-6 pb-4 border-b">
                                <h3 className="mb-1">{item.title}</h3>
                                <span className="block text-gray-500 mb-4">{item.date}</span>
                                <p className="mb-2">{item.summary}</p>
                                <Link className="btn-link" href={`/naujienos/${item.slug}`}>Skaityti daugiau</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
