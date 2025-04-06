"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { YearContext } from '../lib/yearContext';
import { useState, useEffect } from 'react';
import { fetchAndStoreIndexData } from '../lib/indexedDB';
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

export default function RootLayout({ children }) {
    const [year, setYear] = useState(null);

    useEffect(() => {
        async function loadYear() {
            const data = await fetchAndStoreIndexData();
            if (data && data.length > 0) {
                const years = data.map(item => item.year);
                setYear(Math.max(...years));
            }
        }
        loadYear();
    }, []);

    return (
        <html lang="lt">
            <head>
                <title>Ačiū Jums!</title>
                <meta name="description" content="Atvira 1.2% GMP dumenų bazė"></meta>
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <Header />
                <YearContext.Provider value={{ year, setYear }}>
                    {children}
                </YearContext.Provider>
                <Footer />
            </body>
        </html>
    );
}
