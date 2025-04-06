'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useEntityData } from '../../../lib/useEntityData';

export default function EntityPage() {
    const { legal_id } = useParams();

    const { data, loading } = useEntityData(legal_id);

    useEffect(() => {
        if (!data) return;

        const info = data.info[0];
        const finances = data.finances;

        // Populate general info
        const regDate = document.getElementById('reg_date_value');
        const legalForm = document.getElementById('legal_form_value');
        const legalStatus = document.getElementById('legal_status_value');
        const supportStart = document.getElementById('support_start_date_value');
        const nvoStart = document.getElementById('nvo_start_date_value');
        const entityRecordDt = document.getElementById('entity_record_dt');
        const financesRecordDt = document.getElementById('finances_record_dt');

        if (regDate) regDate.textContent = info.ja_reg_data;
        if (legalForm) legalForm.textContent = info.form_pavadinimas;
        if (legalStatus) legalStatus.textContent = info.stat_pavadinimas;
        if (supportStart) supportStart.textContent = info.paramos_gav_nuo;
        if (nvoStart && info.nvo_statusas === 1) nvoStart.textContent = info.paramos_gav_nuo;

        if (entityRecordDt) entityRecordDt.textContent = `Duomenys atnaujinti: ${info.formavimo_data}`;
        const latestFinance = finances.findLast(f => f.record_dt);
        if (financesRecordDt && latestFinance?.record_dt) {
            financesRecordDt.textContent = `Duomenys atnaujinti: ${latestFinance.record_dt}`;
        }

        // Show/hide badges
        if (info.nvo_statusas === 1) {
            document.querySelector('.badge-primary.tooltip-anchor')?.parentElement?.classList.remove('d-none');
        }
        if (info.par_gav_statusas === 1) {
            document.querySelector('.badge-secondary.tooltip-anchor')?.parentElement?.classList.remove('d-none');
        }
        if (info.atskaitingas === 1) {
            document.querySelector('.badge-success.tooltip-anchor')?.parentElement?.classList.remove('d-none');
        }
        if (info.par_gav_statusas === 0) {
            document.querySelector('.badge-danger.tooltip-anchor')?.parentElement?.classList.remove('d-none');
        }

        // Fill finance history table
        const tbody = document.getElementById('tableContent');
        if (tbody) {
            tbody.innerHTML = '';
            finances
                .sort((a, b) => a.year - b.year)
                .forEach(entry => {
                    const row = document.createElement('tr');

                    const year = document.createElement('td');
                    year.textContent = entry.year;

                    const funders = document.createElement('td');
                    funders.textContent = entry.total_funders;

                    const funds = document.createElement('td');
                    funds.textContent = `${entry.total_funds.toLocaleString('lt-LT', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`;

                    row.appendChild(year);
                    row.appendChild(funders);
                    row.appendChild(funds);

                    tbody.appendChild(row);
                });
        }
    }, [data]);

    if (loading) {
        return <div className="p-6 text-xl">Loading entity data...</div>;
    }

    return (
        <div className="container pt-5 mt-10">
            <h2 className="h2">{data.info[0].ja_pavadinimas}</h2>
            <div className="tooltip-wrapper d-none">
                <span className="badge badge-pill badge-primary tooltip-anchor">NVO</span>
                <span className="tooltip">Juridiniam asmeniui yra suteiktas nevyriausybinės organizacijos statusas</span>
            </div>
            <div className="tooltip-wrapper d-none">
                <span className="badge badge-pill badge-secondary tooltip-anchor">Paramos gavėjas</span>
                <span className="tooltip">Juridiniam asmeniui yra suteiktas paramos gavėjo statusas</span>
            </div>
            <div className="tooltip-wrapper d-none">
                <span className="badge badge-pill badge-success tooltip-anchor">Atskaitingas</span>
                <span className="tooltip">Juridinis asmuo pateikė visus privalomus finansinius dokumentus už praėjusius finansinius metus</span>
            </div>
            <div className="tooltip-wrapper d-none">
                <span className="badge badge-pill badge-danger tooltip-anchor">Nėra paramos gavėjas</span>
                <span className="tooltip">Juridiniam asmeniui nėra suteiktas paramos gavėjo statusas</span>
            </div>
            <h3 className="h3 mt-5 mb-2">Organizacijos bendra informacija</h3>
            <div className="row">
                <div className="col-md-6">
                    <ul className="info-list">
                        <li className="mb-4">
                            <span className="d-block font-weight-bold info-name info-name--entity">Įmonės kodas</span>
                            <span className="d-block font-weight-bold info-value info-value--entity">{legal_id}</span>
                        </li>
                        <li className="mb-4">
                            <span className="d-block font-weight-bold info-name info-name--entity">Registracijos data</span>
                            <span id="reg_date_value" className="d-block font-weight-bold info-value info-value--entity"></span>
                        </li>
                        <li className="mb-4">
                            <span className="d-block font-weight-bold info-name info-name--entity">Teisinė forma</span>
                            <span id="legal_form_value" className="d-block font-weight-bold info-value info-value--entity"></span>
                        </li>
                        <li className="mb-4">
                            <span className="d-block font-weight-bold info-name info-name--entity">Teisinis statusas</span>
                            <span id="legal_status_value" className="d-block font-weight-bold info-value info-value--entity"></span>
                        </li>
                    </ul>
                </div>
                <div className="col-md-6">
                    <ul className="info-list">
                        {/* <li className="mb-4 d-none">
                            <span className="font-weight-bold info-name info-name--entity">Teisinio statuso įsigaliojimo data</span>
                            <span className="d-block font-weight-bold info-value info-value--entity">2017-02-08</span>
                        </li> */}
                        <li className="mb-4 d-none">
                            <span className="d-block font-weight-bold info-name info-name--entity">NVO statuso įsigaliojimo data</span>
                            <span id="nvo_start_date_value" className="d-block font-weight-bold info-value info-value--entity"></span>
                        </li>
                        <li className="mb-4 d-none">
                            <span className="d-block font-weight-bold info-name info-name--entity">Paramos gavėjo statuso įsigaliojimo data</span>
                            <span id="support_start_date_value" className="d-block font-weight-bold info-value info-value--entity"></span>
                        </li>
                        <li className="mb-4 d-none">
                            <span className="d-block font-weight-bold info-name info-name--entity">Paramos gavėjo statuso nutraukimo data</span>
                            <span className="d-block font-weight-bold info-value info-value--entity"></span>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="mb-5">
                <span className="d-block text-muted">Šaltinis: <a href="https://www.registrucentras.lt/p/1094" target="_blank" rel="noopener noreferrer">Registrų Centras</a>
                    <a href="https://creativecommons.org/licenses/by/4.0/deed.lt" target="_blank" rel="noopener noreferrer"><i className="fab fa-creative-commons"></i> <i className="fab fa-creative-commons-by"></i></a>
                </span>
                <span id="entity_record_dt" className="d-block text-muted">Duomenys atnaujinti: 2023-11-01</span>
            </div>
            <h3 className="h3 mb-2">1,2% GPM Paramos gavimo istorija</h3>
            <div className="table-responsive pb-2">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Metai</th>
                            <th>Teikėjų skaičius</th>
                            <th>Paramos suma, EUR</th>
                        </tr>
                    </thead>
                    <tbody id="tableContent">
                    </tbody>
                </table>
            </div>
            <div className="mt-2 mb-2">
                <span className="d-block text-muted">Šaltinis: <a href="https://www.vmi.lt/evmi/paramos-statistika?lang=lt" target="_blank" rel="noopener noreferrer">VMI</a></span>
                <span id="finances_record_dt" className="d-block text-muted">Duomenys atnaujinti: 2023-11-16</span>
            </div>
        </div>
    );
}