import { Geist, Geist_Mono } from "next/font/google";
import { fetchIndexData } from '../lib/serverData';
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import YearProvider from "@/components/YearProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    metadataBase: new URL('https://www.aciujums.lt'),
    title: {
        default: 'Ačiū Jums! — Atvira 1,2% GPM duomenų bazė',
        template: '%s — Ačiū Jums!',
    },
    description: 'Atvira duomenų bazė apie 1,2% GPM paramos gavėjus Lietuvoje. Raskite organizacijas, peržiūrėkite savivaldybių statistiką.',
    openGraph: {
        type: 'website',
        siteName: 'Ačiū Jums!',
        images: [{ url: '/images/aciujums_social_cover.png', width: 1200, height: 630, alt: 'Ačiū Jums! — Atvira 1,2% GPM duomenų bazė' }],
    },
    twitter: {
        card: 'summary_large_image',
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ačiū Jums!',
    url: 'https://www.aciujums.lt',
    description: 'Atvira duomenų bazė apie 1,2% GPM paramos gavėjus Lietuvoje.',
    potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://www.aciujums.lt/paieska?ieskoti={search_term_string}' },
        'query-input': 'required name=search_term_string',
    },
    publisher: {
        '@type': 'Organization',
        name: 'NIPC — Nevyriausybinių organizacijų informacijos ir paramos centras',
        url: 'https://www.aciujums.lt/apie-mus',
    },
};

export default async function RootLayout({ children }) {
    const indexData = await fetchIndexData();
    const years = indexData.map((item) => item.year);
    const initialYear = years.length > 0 ? Math.max(...years) : null;

    return (
        <html lang="lt">
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                <Header />
                <main>
                    <YearProvider initialYear={initialYear} initialData={indexData}>
                        {children}
                    </YearProvider>
                </main>
                <Footer />
            </body>
        </html>
    );
}
