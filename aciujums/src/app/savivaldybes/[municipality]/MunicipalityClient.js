'use client';
import { useContext, useEffect, useState, useRef } from 'react';
import { Chart, BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { useParams } from 'next/navigation';

// Register once at module level — not inside the component where it re-runs on every render
Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend);
import { YearContext } from '@/lib/yearContext';
import { municipalityMap } from '@/lib/municipalityMap';
import { getAvailableYears, initDB } from '@/lib/indexedDB';
import CustomDropdown from '@/components/CustomDropdown';
import EntityTable from '@/components/EntityTable';


export default function MunicipalityClient() {
    const { municipality } = useParams();
    const municipalityName = municipalityMap[municipality];

    const { year: initialYear } = useContext(YearContext);
    const [availableYears, setAvailableYears] = useState([]);
    const [filterStart, setFilterStart] = useState("");
    const [filterEnd, setFilterEnd] = useState("");

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
        if (filterStart && filterEnd) updateChartData();

        async function updateChartData() {
            const db = await initDB();
            const store = db.transaction('indexDataByYear', 'readonly').objectStore('indexDataByYear');
            const allData = await store.getAll();
            const sortedData = allData.sort((a, b) => a.year - b.year);

            const startYear = Number(filterStart);
            const endYear = Number(filterEnd);
            const filtered = sortedData.filter(entry => entry.year >= startYear && entry.year <= endYear);

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

            const latestRecord = sortedData.findLast(entry =>
                entry.data.some(d => d.municipality === municipality)
            );
            const recordDate = latestRecord?.data.find(d => d.municipality === municipality)?.record_dt || null;

            setChartData({ years, totalFunds, totalFunders, totalRecipients, recordDate });
        }

        updateChartData();
    }, [filterStart, filterEnd]);


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
                        ticks: { callback: (value) => `€ ${value.toLocaleString('lt-LT')}` }
                    }
                }
            }
        });

        const c2 = new Chart(canvas2Ref.current, {
            type: 'bar',
            data: {
                labels: chartData.years,
                datasets: [
                    { label: 'Paramos teikėjai', data: [], backgroundColor: "#5c7402" },
                    { label: 'Paramos gavėjai',  data: [], backgroundColor: "#abd805" }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => value.toLocaleString('lt-LT') }
                    }
                }
            }
        });

        chart1Ref.current = c1;
        chart2Ref.current = c2;

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
            <div className="flex items-center mt-12 mb-12 pt-50">
                {/* alt="" is intentional — the municipality name is in the adjacent h2 */}
                <img className="municipality-coa" src={`/images/savivaldybes/${municipality}.gif`} alt="" width="71" height="71" />
                <h2>{municipalityName}</h2>
            </div>
            <h3 className="mb-2">Savivaldybės statistika</h3>
            <div className="filters-container">
                <label className="info-name">Metai</label>
                <div className="flex justify-start items-center">
                    <div className="inline-block mr-4 pb-2">
                        <span className="block"><strong>nuo:</strong></span>
                    </div>
                    <div className="inline-block mr-4 pb-2">
                        <CustomDropdown
                            value={availableYears.map(yr => ({ value: yr, label: yr })).find(option => option.value === filterStart)}
                            options={availableYears.map((yr) => ({ value: yr, label: yr }))}
                            onChange={(selectedOption) => setFilterStart(selectedOption.value)}
                            listClassName="year-list"
                        />
                    </div>
                    <div className="inline-block mr-4 pb-2">
                        <span className="block"><strong>iki</strong></span>
                    </div>
                    <div className="inline-block mr-4 pb-2">
                        <CustomDropdown
                            value={availableYears.map(yr => ({ value: yr, label: yr })).find(option => option.value === filterEnd)}
                            options={availableYears.map((yr) => ({ value: yr, label: yr }))}
                            onChange={(selectedOption) => setFilterEnd(selectedOption.value)}
                            listClassName="year-list"
                        />
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap">
                <div className="w-full lg:w-1/2 canvas-container">
                    <canvas id="mb_munici_viz_1" className="canvas" width="402" height="300" ref={canvas1Ref}></canvas>
                </div>
                <div className="w-full lg:w-1/2 canvas-container">
                    <canvas id="mb_munici_viz_2" className="canvas" width="402" height="300" ref={canvas2Ref}></canvas>
                </div>
            </div>
            <div className="mt-2 mb-2">
                <span className="block text-gray-500">Šaltinis: <a href="https://www.vmi.lt/evmi/paramos-statistika?lang=lt" target="_blank" rel="noopener noreferrer">VMI</a></span>
                <span id="vmi_record_dt" className="block text-gray-500">Duomenys atnaujinti: {chartData.recordDate}</span>
            </div>
            <div className="entity-list mt-12">
                <h3>Organizacijos</h3>
                <EntityTable municipality={municipality} initialYear={initialYear} availableYears={availableYears} />
            </div>
        </div>
    );
}
