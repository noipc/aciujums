import { newsItems } from '@/lib/newsData';
import { readFile } from 'fs/promises';
import path from 'path';
import Link from 'next/link';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const article = newsItems.find((item) => item.slug === slug);
    if (!article) return { title: 'Straipsnis' };
    return {
        title: article.title,
        description: article.summary,
        openGraph: {
            title: article.title,
            description: article.summary,
            type: 'article',
            publishedTime: article.date,
        },
    };
}

export default async function NewsArticlePage({ params }) {
    const { slug } = await params;
    const article = newsItems.find((item) => item.slug === slug);

    if (!article) {
        return <div className="container pt-10">Straipsnis nerastas</div>;
    }

    let htmlContent = '';
    try {
        const filePath = path.join(process.cwd(), 'public', 'news-html', article.htmlFile);
        htmlContent = await readFile(filePath, 'utf8');
    } catch {
        htmlContent = '<p>Turinys laikinai nepasiekiamas.</p>';
    }

    return (
        <div className="container pt-10">
            <Link href="/naujienos" className="text-sm mb-4 block">&larr; Naujienos</Link>
            <h1 className="mb-2">{article.title}</h1>
            <span className="text-gray-500 mb-6 block">{article.date}</span>
            <div
                className="article-html"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>
    );
}
