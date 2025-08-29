'use client';
import Link from 'next/link';
import { useIndexData } from '../lib/useIndexData';
import { useState, useEffect, useContext, use } from 'react';
import { YearContext } from '../lib/yearContext';
import { FillMunicipalityData } from '@/lib/fillMunicipalityDataAtHome';
import { getAvailableYears, initDB } from '@/lib/indexedDB';
import MapContainer from "@/components/MapContainer";
import SummaryComponent from '@/components/SummaryComponent';
import Accordion from '@/components/Accordion';
import groupByCounty from '@/lib/groupByCounty';

export default function Home() {

    const { year, setYear } = useContext(YearContext);
    const [availableYears, setAvailableYears] = useState([]);
    const { data, loading } = useIndexData();
    const [filteredData, setFilteredData] = useState([]);
    const [previewSummary, setPreviewSummary] = useState(null);
    const [summary, setSummary] = useState({
        title: "Visos savivaldybės",
        totalFunds: 0,
        totalFunders: 0,
        totalRecipients: 0
    });
    const [accordionData, setAccordionData] = useState([]);

    useEffect(() => {

        async function getYears() {

            const years = await getAvailableYears();
            setAvailableYears(years)
        };

        getYears();

    }, []);
    

    useEffect(() => {
        if (data && year ) {
            const filtered = data.filter((entry) => entry.year === year);
            setFilteredData(filtered);
            const accorData = groupByCounty(filtered);
            setAccordionData(accorData);
        }
    }, [data, year]);

    useEffect(() => {

        let totalFundsSum = 0;
        let totalFundersSum = 0;
        let totalRecipientsCount = 0;

        filteredData.forEach((entry) => {
            totalFundsSum += entry.total_funds || 0;
            totalFundersSum += entry.total_funders || 0;
            totalRecipientsCount += entry.total_recipients || 0;
        });

        setSummary({
            title: "Visos savivaldybės",
            totalFunds: totalFundsSum,
            totalFunders: totalFundersSum,
            totalRecipients: totalRecipientsCount
        });

    }, [filteredData]);

    const displaySummary = previewSummary || summary;

    return (
        <div className="ml-15 mr-15 mt-5 container">
            <h2 className="h2 text-center mt-100">Atvira 1.2% GPM duomenų bazė</h2>
            <div className="map-wrapper">
                <SummaryComponent 
                    className="summary-overlay"
                    title={displaySummary.title} 
                    totalFunds={displaySummary.totalFunds}
                    totalFunders={displaySummary.totalFunders}
                    totalRecipients={displaySummary.totalRecipients}
                    year={year} 
                    availableYears={availableYears} 
                    onChangeYear={setYear} 
                />
                <MapContainer onRegionHover={setPreviewSummary} onRegionLeave={() => setPreviewSummary(null)} data={filteredData} />
            </div> 
            <div className="mobile-container mt-5 mb-3">
                <Accordion data={accordionData} />
            </div>
        </div>
    );
}

