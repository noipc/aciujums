"use client";
import { Geist, Geist_Mono, Mona_Sans } from "next/font/google";
import { YearContext } from '../lib/yearContext';
import { useState, useEffect } from 'react';
import { fetchAndStoreIndexData, fetchAndStoreSearchIndex} from '../lib/indexedDB';
import "./globals.css";
import "./custom.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const monaSans = Mona_Sans({
    variable: "--font-mona-sans",
    subsets: ["latin"],
});

export default function RootLayout({ children }) {
    const [year, setYear] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const [indexData] = await Promise.all([
                fetchAndStoreIndexData(),
                fetchAndStoreSearchIndex()
            ]);

            if (indexData && indexData.length > 0) {
                const years = indexData.map(item => item.year);
                setYear(Math.max(...years));
            }
            setLoading(false);
        }
        loadData();
    }, []);

    return (
        <html lang="lt">
            <head>
                <title>Ačiū Jums!</title>
                <meta name="description" content="Atvira 1.2% GMP dumenų bazė"></meta>
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <Header />
                {loading || !year ? (
                    <div className="p-6 text-xl">Loading index data…</div>
                    ) : (
                    <YearContext.Provider value={{ year, setYear }}>
                        {children}
                    </YearContext.Provider>
                )}
                <Footer />
            </body>
        </html>
    );
}
