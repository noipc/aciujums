'use client';
import { useContext, useEffect, useState, useRef } from 'react';
import { Chart, BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { useParams } from 'next/navigation';
import { YearContext } from '@/lib/yearContext';
import { municipalityMap } from '@/lib/municipalityMap';
import { getAvailableYears, initDB } from '@/lib/indexedDB';
import CustomDropdown from '@/components/CustomDropdown';
import EntityTable from '@/components/EntityTable';


export default function MunicipalityPage() {
    const { municipality } = useParams();
    const municipalityName = municipalityMap[municipality];

    // Get the initial year from context only for the first load.
    const { year: initialYear } = useContext(YearContext);
    //const [localYear, setLocalYear]           = useState(initialYear);
    const [availableYears, setAvailableYears] = useState([]);
    const [filterStart, setFilterStart] = useState("");
    const [filterEnd, setFilterEnd] = useState("");

    Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend);
    const chart1Ref = useRef(null);
    const chart2Ref = useRef(null);
    const canvas1Ref = useRef(null);
    const canvas2Ref = useRef(null);

    const [chartData, setChartData] = useState({
        years: [],
        totalFunds: [],
        totalFunders: [],
        totalRecipients: [],
        recordDate: null,
    });


    useEffect(() => {

        async function setupDropdowns() {

            const years = await getAvailableYears();

            if (!years.length) return;

            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);

            setFilterStart(minYear);
            setFilterEnd(maxYear);
            setAvailableYears(years);

        }
        setupDropdowns();

    }, []);

    useEffect(() => {

        if (filterStart && filterEnd) {
            updateChartData();
        }

        async function updateChartData() {
            const db = await initDB();
            const store = db.transaction('indexDataByYear', 'readonly').objectStore('indexDataByYear');
            const allData = await store.getAll();
            const sortedData = allData.sort((a, b) => a.year - b.year);

            // Ensure filterStart and filterEnd are numbers
            const startYear = Number(filterStart);
            const endYear = Number(filterEnd);
            const filtered = sortedData.filter(entry => entry.year >= startYear && entry.year <= endYear);

            // Map the filtered results for charts
            const years = filtered.map(entry => entry.year);
            const totalFunds = filtered.map(entry => {
                const muniData = entry.data.find(d => d.municipality === municipality);
                return muniData ? muniData.total_funds : 0;
            });
            const totalFunders = filtered.map(entry => {
                const muniData = entry.data.find(d => d.municipality === municipality);
                return muniData ? muniData.total_funders : 0;
            });
            const totalRecipients = filtered.map(entry => {
                const muniData = entry.data.find(d => d.municipality === municipality);
                return muniData ? (muniData.total_recipients || 0) : 0;
            });

            // Get record date from the latest record (if needed)
            const latestRecord = sortedData.findLast(entry =>
                entry.data.some(d => d.municipality === municipality)
            );
            const recordDate = latestRecord?.data.find(d => d.municipality === municipality)?.record_dt || null;

            setChartData({ years, totalFunds, totalFunders, totalRecipients, recordDate });

        }

        updateChartData();

    }, [filterStart, filterEnd]);


    // Initialize or update the first chart based on chartData changes
    useEffect(() => {

        const c1 = new Chart(canvas1Ref.current, {
            type: 'bar',
            data: {
                labels: chartData.years,
                datasets: [{
                    label: '1.2% GPM Paramos suma (EUR)',
                    data: [],
                    backgroundColor: "#97BF04",
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) =>
                                `€ ${ctx.raw.toLocaleString('lt-LT', { minimumFractionDigits: 2 })}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `€ ${value.toLocaleString('lt-LT')}`
                        }
                    }
                }
            }
        });

        const c2 = new Chart(canvas2Ref.current, {
            type: 'bar',
            data: {
                labels: chartData.years,
                datasets: [
                    {
                        label: 'Paramos teikėjai',
                        data: [],
                        backgroundColor: "#5c7402",
                    },
                    {
                        label: 'Paramos gavėjai',
                        data: [],
                        backgroundColor: "#abd805",
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('lt-LT')
                        }
                    }
                }
            }
        });

        chart1Ref.current = c1;
        chart2Ref.current = c2;


        // 🧹 Cleanup on unmount or dependency change
        return () => {
            c1.destroy();
            c2.destroy();
            chart1Ref.current = null;
            chart2Ref.current = null;
        };

    }, []);

    useEffect(() => {
        if (!chart1Ref.current || !chart2Ref.current) return;

        const { years, totalFunds, totalFunders, totalRecipients } = chartData;

        const c1 = chart1Ref.current;
        c1.data.labels = years;
        c1.data.datasets[0].data = totalFunds;
        c1.update('none');

        const c2 = chart2Ref.current;
        c2.data.labels = years;
        c2.data.datasets[0].data = totalFunders;
        c2.data.datasets[1].data = totalRecipients;
        c2.update('none');

        
    }, [chartData]);


    return (
        <div className="container pt-15">
            <div className="d-flex align-items-center mt-5 mb-5 pt-50">
                <img className="municipality-coa" src={`/images/savivaldybes/${municipality}.gif`}></img>
                <h2 className="h2">{municipalityName}</h2>
            </div>
            <h3 className="h3 mb-2">Savivaldybės statistika</h3>
            <div className="filters-container">
                <label className="info-name">Metai</label>
                <div className="d-flex justify-content-start align-items-center">
                    <div className="d-inline-block mr-3 pb-2">
                        <span className="d-block"><strong>nuo:</strong></span>
                    </div>
                    <div className="d-inline-block mr-3 pb-2">
                        <CustomDropdown
                            value={availableYears.map(yr => ({ value: yr, label: yr })).find(option => option.value === filterStart)}
                            options={availableYears.map((yr) => ({ value: yr, label: yr }))}
                            onChange={(selectedOption) => setFilterStart(selectedOption.value)}
                            listClassName="year-list"
                        />
                    </div>
                    <div className="d-inline-block mr-3 pb-2">
                        <span className="d-block"><strong>iki</strong></span>
                    </div>
                    <div className="d-inline-block mr-3 pb-2">
                        <CustomDropdown
                            value={availableYears.map(yr => ({ value: yr, label: yr })).find(option => option.value === filterEnd)}
                            options={availableYears.map((yr) => ({ value: yr, label: yr }))}
                            onChange={(selectedOption) => setFilterEnd(selectedOption.value)}
                            listClassName="year-list"
                        />
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-sm-12 col-lg-6 canvas-container">
                    <canvas id="mb_munici_viz_1" className="canvas" width="402" height="300" ref={canvas1Ref}></canvas>
                </div>
                <div className="col-sm-12 col-lg-6 canvas-container">
                    <canvas id="mb_munici_viz_2" className="canvas" width="402" height="300" ref={canvas2Ref}></canvas>
                </div>
            </div>
            <div className="mt-2 mb-2">
                <span className="d-block text-muted">Šaltinis: <a href="https://www.vmi.lt/evmi/paramos-statistika?lang=lt" target="_blank" rel="noopener noreferrer">VMI</a></span>
                <span id="vmi_record_dt" className="d-block text-muted">Duomenys atnaujinti: {chartData.recordDate}</span>
            </div>
            <div className="entity-list mt-5">
                <h3 className="h3">Organizacijos</h3>
                <EntityTable municipality={municipality} initialYear={initialYear} availableYears={availableYears} />
            </div>
        </div>
    );
}