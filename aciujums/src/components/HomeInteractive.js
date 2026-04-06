'use client';

import { useState, useEffect, useContext } from 'react';
import dynamic from 'next/dynamic';
import { YearContext } from '../lib/yearContext';
import SummaryComponent from '@/components/SummaryComponent';
import Accordion from '@/components/Accordion';
import groupByCounty from '@/lib/groupByCounty';

const MapContainer = dynamic(() => import('@/components/MapContainer'), { ssr: false, loading: () => <div className="map-container" style={{ minHeight: 400 }} /> });

export default function HomeInteractive() {
    const { year, setYear, data, availableYears } = useContext(YearContext);
    const [filteredData, setFilteredData] = useState([]);
    const [previewSummary, setPreviewSummary] = useState(null);
    const [summary, setSummary] = useState({
        title: 'Visos savivaldybės',
        totalFunds: 0,
        totalFunders: 0,
        totalRecipients: 0,
    });
    const [accordionData, setAccordionData] = useState([]);

    useEffect(() => {
        if (!data || !year) return;
        const filtered = data.filter((entry) => entry.year === year);
        setFilteredData(filtered);
        setAccordionData(groupByCounty(filtered));

        let totalFundsSum = 0;
        let totalFundersSum = 0;
        let totalRecipientsCount = 0;
        filtered.forEach((entry) => {
            totalFundsSum += entry.total_funds || 0;
            totalFundersSum += entry.total_funders || 0;
            totalRecipientsCount += entry.total_recipients || 0;
        });
        setSummary({
            title: 'Visos savivaldybės',
            totalFunds: totalFundsSum,
            totalFunders: totalFundersSum,
            totalRecipients: totalRecipientsCount,
        });
    }, [data, year]);

    const displaySummary = previewSummary || summary;

    return (
        <>
            <div className="map-wrapper">
                <SummaryComponent
                    title={displaySummary.title}
                    totalFunds={displaySummary.totalFunds}
                    totalFunders={displaySummary.totalFunders}
                    totalRecipients={displaySummary.totalRecipients}
                    year={year}
                    availableYears={availableYears}
                    onChangeYear={setYear}
                />
                <MapContainer
                    onRegionHover={setPreviewSummary}
                    onRegionLeave={() => setPreviewSummary(null)}
                    data={filteredData}
                />
                <div className="map-legend justify-center mt-2">
                    <ul className="flex flex-row items-center">
                        <li><span className="legend-dot ml-2 amount-range-1"></span><span className="inline-block ml-[10px]">&lt;</span> 50 000</li>
                        <li><span className="legend-dot ml-2 amount-range-2"></span><span className="inline-block ml-[10px]">&lt;</span> 100 000</li>
                        <li><span className="legend-dot ml-2 amount-range-3"></span><span className="inline-block ml-[10px]">&lt;</span> 200 000</li>
                        <li><span className="legend-dot ml-2 amount-range-4"></span><span className="inline-block ml-[10px]">&lt;</span> 500 000</li>
                        <li><span className="legend-dot ml-2 amount-range-5"></span><span className="inline-block ml-[10px]">&gt;</span> 500 000</li>
                    </ul>
                </div>
            </div>
            <div className="mobile-container mt-5 mb-3">
                <Accordion data={accordionData} />
            </div>
        </>
    );
}
