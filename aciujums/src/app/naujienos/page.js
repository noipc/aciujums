import Link from 'next/link';
import { newsItems } from '@/lib/newsData';

export default function NewsPage() {

    const sortedNews = [...newsItems].sort((a, b) => {
        return new Date(b.date) - new Date(a.date); // DESCENDING
    });

    return (
        <div className="container pt-5 mt-5">
            <h2 className="title mb-5">Naujienos</h2>
            <div className="row">
                <div className="col-12 mb-3">
                    <ul className="news-list">
                        {sortedNews.map((item) => (
                            <li key={item.slug} className="mb-4 pb-3 border-bottom">
                                <h3 className="h3 mb-1">{item.title}</h3>
                                <span className="d-block text-muted mb-3">{item.date}</span>
                                <p className="mb-2">{item.summary}</p>
                                <Link className="btn btn-link" href={`/naujienos/${item.slug}`}>Skaityti daugiau</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}