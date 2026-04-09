'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { newsItems } from '@/lib/newsData';

export default function NewsArticleClient({ slug }) {
    const [htmlContent, setHtmlContent] = useState('');
    const article = newsItems.find((item) => item.slug === slug);

    useEffect(() => {
        if (!article) return;

        fetch(`/news-html/${article.htmlFile}`)
            .then((res) => res.text())
            .then(setHtmlContent);
    }, [article]);

    if (!article) return <div className="container pt-10">Straipsnis nerastas</div>;

    return (
        <div className="container pt-10">
            <h1 className="mb-2">{article.title}</h1>
            <span className="text-gray-500 mb-6 block">{article.date}</span>
            <div
                className="article-html"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>
    );
}