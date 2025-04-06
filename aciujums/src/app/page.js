'use client';
import Link from 'next/link';
import { useIndexData } from '../lib/useIndexData';
import { useState, useEffect, useContext } from 'react';
import { YearContext } from '../lib/yearContext';
import { FillMunicipalityData } from '@/lib/fillMunicipalityDataAtHome';

export default function Home() {
    const { year, setYear } = useContext(YearContext);
    const { data, loading } = useIndexData();
    const [filteredData, setFilteredData] = useState([]);

    useEffect(() => {
        if (data && year ) {
            const filtered = data.filter((entry) => entry.year === year);
            setFilteredData(filtered);
        }
    }, [data, year]);

    if (loading || !year) {
        return <div className="p-6 text-xl">Loading index data...</div>;
    }

    return (
        <div className="ml-15 mr-15 mt-5 container">
            <h2 className="h2 text-center mt-100">Atvira 1.2% GPM duomenų bazė</h2>
            <div className="map-info mt-md-2 mt-xl-7">
                <div className="mt-1 mb-1 pl-2 pr-2">
                    <h2 id="info-title" className="info-title d-inline-block">Visos savivaldybės</h2>
                    <ul className="info-list">
                        <li className="mb-1">
                            <span className="d-block info-name">1,2% GPM Paramos suma</span>
                            <span id="funds-info-value" className="d-block info-value"></span></li>
                        <li className="mb-1">
                            <span className="d-block info-name">1,2% GPM paramos teikėjų skaičius</span>
                            <span id="funders-info-value" className="d-block info-value"></span>
                        </li>
                        <li className="mb-1">
                            <span className="d-block info-name">1,2% GPM paramos gavėjų skaičius</span>
                            <span id="recipients-info-value" className="d-block info-value"></span>
                        </li>
                    </ul>
                    <span className="d-blok info-name">{year} metų duomenys</span>
                </div>
            </div>
            <div className="mobile-container mt-5 mb-3">
                <input type="checkbox" id="alytaus-apskritis-state-checkbox" className="d-none armonica-state-checkbox"></input>
                <div className="armonica-container">
                    <label htmlFor="alytaus-apskritis-state-checkbox" className="armonica-header">
                        <h3 className="h3 armonica-title">Alytaus apskritis</h3>
                    </label>
                    <ul className="armonica-content">
                        <li className="armonica-content-item"><Link href="/savivaldybes/alytaus-miesto-savivaldybe"><span className="d-block info-name">Alytaus miesto savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/alytaus-rajono-savivaldybe"><span className="d-block info-name">Alytaus rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/druskininku-savivaldybe"><span className="d-block info-name">Druskininkų savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/lazdiju-rajono-savivaldybe"><span className="d-block info-name">Lazdijų rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/varenos-rajono-savivaldybe"><span className="d-block info-name">Varėnos rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                    </ul>
                </div>
                <input type="checkbox" id="kauno-apskritis-state-checkbox" className="d-none armonica-state-checkbox"></input>
                <div className="armonica-container">
                    <label htmlFor="kauno-apskritis-state-checkbox" className="armonica-header">
                        <h3 className="h3 armonica-title">Kauno apskritis</h3>
                    </label>
                    <ul className="armonica-content">
                        <li className="armonica-content-item"><Link href="/savivaldybes/birstono-savivaldybe"><span className="d-block info-name">Birštono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/jonavos-rajono-savivaldybe"><span className="d-block info-name">Jonavos rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/kaisiadoriu-rajono-savivaldybe"><span className="d-block info-name">Kaišiadorių rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/kauno-miesto-savivaldybe"><span className="d-block info-name">Kauno miesto savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/kauno-rajono-savivaldybe"><span className="d-block info-name">Kauno rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/kedainiu-rajono-savivaldybe"><span className="d-block info-name">Kėdainių rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/prienu-rajono-savivaldybe"><span className="d-block info-name">Prienų rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/raseiniu-rajono-savivaldybe"><span className="d-block info-name">Raseiniu rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                    </ul>
                </div>
                <input type="checkbox" id="klaipedos-apskritis-state-checkbox" className="d-none armonica-state-checkbox"></input>
                <div className="armonica-container">
                    <label htmlFor="klaipedos-apskritis-state-checkbox" className="armonica-header">
                        <h3 className="h3 armonica-title">Klaipėdos apskritis</h3>
                    </label>
                    <ul className="armonica-content">
                        <li className="armonica-content-item"><Link href="/savivaldybes/klaipedos-miesto-savivaldybe"><span className="d-block info-name">Klaipėdos miesto savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/klaipedos-rajono-savivaldybe"><span className="d-block info-name">Klaipėdos rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/kretingos-rajono-savivaldybe"><span className="d-block info-name">Kretingos rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/neringos-savivaldybe"><span className="d-block info-name">Neringos savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/palangos-miesto-savivaldybe"><span className="d-block info-name">Palangos miesto savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/silutes-rajono-savivaldybe"><span className="d-block info-name">Šilutės rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/skuodo-rajono-savivaldybe"><span className="d-block info-name">Skuodo rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                    </ul>
                </div>
                <input type="checkbox" id="marijampoles-apskritis-state-checkbox" className="d-none armonica-state-checkbox"></input>
                <div className="armonica-container">
                    <label htmlFor="marijampoles-apskritis-state-checkbox" className="armonica-header">
                        <h3 className="h3 armonica-title">Marijampolės apskritis</h3>
                    </label>
                    <ul className="armonica-content">
                        <li className="armonica-content-item"><Link href="/savivaldybes/kalvarijos-savivaldybe"><span className="d-block info-name">Kalvarijos savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/kazlu-rudos-savivaldybe"><span className="d-block info-name">Kazlų Rūdos savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/marijampoles-savivaldybe"><span className="d-block info-name">Marijampolės savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/sakiu-rajono-savivaldybe"><span className="d-block info-name">Šakių rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/vilkaviskio-rajono-savivaldybe"><span className="d-block info-name">Vilkaviškio rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                    </ul>
                </div>
                <input type="checkbox" id="panevezio-apskritis-state-checkbox" className="d-none armonica-state-checkbox"></input>
                <div className="armonica-container"><label htmlFor="panevezio-apskritis-state-checkbox" className="armonica-header">
                    <h3 className="h3 armonica-title">Panevėžio apskritis</h3>
                    </label>
                    <ul className="armonica-content">
                        <li className="armonica-content-item"><Link href="/savivaldybes/birzu-rajono-savivaldybe"><span className="d-block info-name">Biržų rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/kupiskio-rajono-savivaldybe"><span className="d-block info-name">Kupiškio rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/panevezio-miesto-savivaldybe"><span className="d-block info-name">Panevėžio miesto savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/panevezio-rajono-savivaldybe"><span className="d-block info-name">Panevėžio rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/pasvalio-rajono-savivaldybe"><span className="d-block info-name">Pasvalio rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/rokiskio-rajono-savivaldybe"><span className="d-block info-name">Rokiškio rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                    </ul>
                </div>
                <input type="checkbox" id="siauliu-apskritis-state-checkbox" className="d-none armonica-state-checkbox"></input>
                <div className="armonica-container"><label htmlFor="siauliu-apskritis-state-checkbox" className="armonica-header">
                    <h3 className="h3 armonica-title">Šiaulių apskritis</h3></label>
                    <ul className="armonica-content">
                        <li className="armonica-content-item"><Link href="/savivaldybes/akmenes-rajono-savivaldybe"><span className="d-block info-name">Akmenės rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/joniskio-rajono-savivaldybe"><span className="d-block info-name">Joniškio rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/kelmes-rajono-savivaldybe"><span className="d-block info-name">Kelmės rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/pakruojo-rajono-savivaldybe"><span className="d-block info-name">Pakruojo rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/radviliskio-rajono-savivaldybe"><span className="d-block info-name">Radviliškio rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/siauliu-miesto-savivaldybe"><span className="d-block info-name">Šiaulių miesto savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/siauliu-rajono-savivaldybe"><span className="d-block info-name">Šiaulių rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                    </ul>
                </div>
                <input type="checkbox" id="taurages-apskritis-state-checkbox" className="d-none armonica-state-checkbox"></input>
                <div className="armonica-container">
                    <label htmlFor="taurages-apskritis-state-checkbox" className="armonica-header">
                        <h3 className="h3 armonica-title">Tauragės apskritis</h3>
                    </label>
                    <ul className="armonica-content">
                        <li className="armonica-content-item"><Link href="/savivaldybes/jurbarko-rajono-savivaldybe"><span className="d-block info-name">Jurbarko rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/pagegiu-savivaldybe"><span className="d-block info-name">Pagėgių savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/silales-rajono-savivaldybe"><span className="d-block info-name">Šilalės rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/taurages-rajono-savivaldybe"><span className="d-block info-name">Tauragės rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                    </ul>
                </div>
                <input type="checkbox" id="telsiu-apskritis-state-checkbox" className="d-none armonica-state-checkbox"></input>
                <div className="armonica-container">
                    <label htmlFor="telsiu-apskritis-state-checkbox" className="armonica-header">
                        <h3 className="h3 armonica-title">Telšių apskritis</h3>
                    </label>
                    <ul className="armonica-content">
                        <li className="armonica-content-item"><Link href="/savivaldybes/mazeikiu-rajono-savivaldybe"><span className="d-block info-name">Mažeikių rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/plunges-rajono-savivaldybe"><span className="d-block info-name">Plungės rajono savivaldybė</span><span className="d-block info-value">2</span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/rietavo-savivaldybe"><span className="d-block info-name">Rietavo savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/telsiu-rajono-savivaldybe"><span className="d-block info-name">Telšių rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                    </ul>
                </div>
                <input type="checkbox" id="utenos-apskritis-state-checkbox" className="d-none armonica-state-checkbox"></input>
                <div className="armonica-container">
                    <label htmlFor="utenos-apskritis-state-checkbox" className="armonica-header">
                        <h3 className="h3 armonica-title">Utenos apskritis</h3>
                    </label>
                    <ul className="armonica-content">
                        <li className="armonica-content-item"><Link href="/savivaldybes/anyksciu-rajono-savivaldybe"><span className="d-block info-name">Anykščių rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/ignalinos-rajono-savivaldybe"><span className="d-block info-name">Ignalinos rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/moletu-rajono-savivaldybe"><span className="d-block info-name">Molėtų rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/utenos-rajono-savivaldybe"><span className="d-block info-name">Utenos rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/visagino-savivaldybe"><span className="d-block info-name">Visagino savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/zarasu-rajono-savivaldybe"><span className="d-block info-name">Zarasų rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                    </ul>
                </div>
                <input type="checkbox" id="vilniaus-apskritis-state-checkbox" className="d-none armonica-state-checkbox"></input>
                <div className="armonica-container">
                    <label htmlFor="vilniaus-apskritis-state-checkbox" className="armonica-header">
                        <h3 className="h3 armonica-title">Vilniaus apskritis</h3>
                    </label>
                    <ul className="armonica-content">
                        <li className="armonica-content-item"><Link href="/savivaldybes/elektrenu-savivaldybe"><span className="d-block info-name">Elektrėnų savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/salcininku-rajono-savivaldybe"><span className="d-block info-name">Šalčininkų rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/sirvintu-rajono-savivaldybe"><span className="d-block info-name">Širvintų rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/svencioniu-rajono-savivaldybe"><span className="d-block info-name">Švenčionių rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/traku-rajono-savivaldybe"><span className="d-block info-name">Trakų rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/ukmerges-rajono-savivaldybe"><span className="d-block info-name">Ukmergės rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/vilniaus-miesto-savivaldybe"><span className="d-block info-name">Vilniaus miesto savivaldybė</span><span className="d-block info-value"></span></Link></li>
                        <li className="armonica-content-item"><Link href="/savivaldybes/vilniaus-rajono-savivaldybe"><span className="d-block info-name">Vilniaus rajono savivaldybė</span><span className="d-block info-value"></span></Link></li>
                    </ul>
                </div>
            </div>
            <FillMunicipalityData data={filteredData} />
        </div>
    );
}

