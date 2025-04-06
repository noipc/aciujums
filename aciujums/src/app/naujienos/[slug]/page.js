'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { newsItems } from '@/lib/newsData';

export default function NewsArticle() {
    const params = useParams();
    const slug = params.slug;

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
            <h1 className="h1 mb-2">{article.title}</h1>
            <span className="text-muted mb-4 d-block">{article.date}</span>
            <div
                className="article-html"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>
    );
}