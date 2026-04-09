import React, { useState } from "react";
import Link from "next/link";

export default function Accordion({ data }) {

    const municipalitiesMap = {
        "alytaus-miesto-savivaldybe"     :"Alytaus miesto savivaldybė",
        "alytaus-rajono-savivaldybe"     :"Alytaus rajono savivaldybė",
        "druskininku-savivaldybe"        :"Druskininkų savivaldybė",
        "lazdiju-rajono-savivaldybe"     :"Lazdijų rajono savivaldybė",
        "varenos-rajono-savivaldybe"     :"Varėnos rajono savivaldybė",
        "birstono-savivaldybe"           :"Birštono savivaldybė",
        "jonavos-rajono-savivaldybe"     :"Jonavos rajono savivaldybė",
        "kaisiadoriu-rajono-savivaldybe" :"Kaišiadorų rajono savivaldybė",
        "kauno-miesto-savivaldybe"       :"Kauno miesto savivaldybė",
        "kauno-rajono-savivaldybe"       :"Kauno rajono savivaldybė",
        "kedainiu-rajono-savivaldybe"    :"Kėdainių rajono savivaldybė",
        "prienu-rajono-savivaldybe"      :"Prienų rajono savivaldybė",
        "raseiniu-rajono-savivaldybe"    :"Raseinių rajono savivaldybė",
        "klaipedos-miesto-savivaldybe"   :"Klaipėdos miesto savivaldybė",
        "klaipedos-rajono-savivaldybe"   :"Klaipėdos rajono savivaldybė",
        "kretingos-rajono-savivaldybe"   :"Kretingos rajono savivaldybė",
        "neringos-savivaldybe"           :"Neringos savivaldybė",
        "palangos-miesto-savivaldybe"    :"Palangos miesto savivaldybė",
        "silutes-rajono-savivaldybe"     :"Šilutės rajono savivaldybė",
        "skuodo-rajono-savivaldybe"      :"Skuodo rajono savivaldybė",
        "kalvarijos-savivaldybe"         :"Kalvarijos savivaldybė",
        "kazlu-rudos-savivaldybe"        :"Kazlų rūdos savivaldybė",
        "marijampoles-savivaldybe"       :"Marijampolės savivaldybė",
        "sakiu-rajono-savivaldybe"       :"Šakių rajono savivaldybė",
        "vilkaviskio-rajono-savivaldybe" :"Vilkaviškio rajono savivaldybė",
        "birzu-rajono-savivaldybe"       :"Biržų rajono savivaldybė",
        "kupiskio-rajono-savivaldybe"    :"Kupiškio rajono savivaldybė",
        "panevezio-miesto-savivaldybe"   :"Panevėžio miesto savivaldybė",
        "panevezio-rajono-savivaldybe"   :"Panevėžio rajono savivaldybė",
        "pasvalio-rajono-savivaldybe"    :"Pasvalio rajono savivaldybė",
        "rokiskio-rajono-savivaldybe"    :"Rokiškio rajono savivaldybė",
        "akmenes-rajono-savivaldybe"     :"Akmenės rajono savivaldybė",
        "joniskio-rajono-savivaldybe"    :"Joniškio rajono savivaldybė",
        "kelmes-rajono-savivaldybe"      :"Kelmės rajono savivaldybė",
        "pakruojo-rajono-savivaldybe"    :"Pakruojo rajono savivaldybė",
        "radviliskio-rajono-savivaldybe" :"Radviliškio rajono savivaldybė",
        "siauliu-miesto-savivaldybe"     :"Šiaulių miesto savivaldybė",
        "siauliu-rajono-savivaldybe"     :"Šiaulių rajono savivaldybė",
        "jurbarko-rajono-savivaldybe"    :"Jurbarko rajono savivaldybė",
        "pagegiu-savivaldybe"            :"Pagėgių savivaldybė",
        "silales-rajono-savivaldybe"     :"Šilalės rajono savivaldybė",
        "taurages-rajono-savivaldybe"    :"Tauragės rajono savivaldybė",
        "mazeikiu-rajono-savivaldybe"    :"Mažeikių rajono savivaldybė",
        "plunges-rajono-savivaldybe"     :"Plungės rajono savivaldybė",
        "rietavo-savivaldybe"            :"Rietavo rajono savivaldybė",
        "telsiu-rajono-savivaldybe"      :"Telšių rajono savivaldybė",
        "anyksciu-rajono-savivaldybe"    :"Anykščių rajono savivaldybė",
        "ignalinos-rajono-savivaldybe"   :"Ignalinos rajono savivaldybė",
        "moletu-rajono-savivaldybe"      :"Molėtų rajono savivaldybė",
        "utenos-rajono-savivaldybe"      :"Utenos rajono savivaldybė",
        "visagino-savivaldybe"           :"Visagino savivaldybė",
        "zarasu-rajono-savivaldybe"      :"Zarasų rajono savivaldybė",
        "elektrenu-savivaldybe"          :"Elektrėnų savivaldybė",
        "salcininku-rajono-savivaldybe"  :"Šalčinikų rajono savivaldybė",
        "sirvintu-rajono-savivaldybe"    :"Širvintų rajono savivaldybė",
        "svencioniu-rajono-savivaldybe"  :"Švenčionių rajono savivaldybė",
        "traku-rajono-savivaldybe"       :"Trakų rajono savivaldybė",
        "ukmerges-rajono-savivaldybe"    :"Ukmergės rajono savivaldybė",
        "vilniaus-miesto-savivaldybe"    :"Vilniaus miesto savivaldybė",
        "vilniaus-rajono-savivaldybe"    :"Vilniaus rajono savivaldybė",
    }

    const [openIndex, setOpenIndex] = useState(null);
    const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

    return (
        <div className="mobile-container mt-5 mb-3" role="region" aria-label="Savivaldybių sąrašas pagal apskritis">
            {data.map((county, i) => {

                const isOpen   = openIndex === i;
                const headerId = `accordion-header-${i}`;
                const panelId  = `accordion-panel-${i}`;

                return (
                    <div key={county.slug} className="armonica-container">
                        <h3 className="h3 armonica-title">
                            <div
                                id={headerId}
                                className="armonica-header w-full text-left"
                                role="button"
                                tabIndex={0}
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                onClick={() => toggle(i)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }}
                            >
                                {county.name}
                            </div>
                        </h3>
                        <div 
                            id={panelId} 
                            role="region" 
                            className={`armonica-content${isOpen ? ' open' : ''}`}
                            aria-labelledby={headerId}
                            aria-hidden={!isOpen}
                        >
                            <ul>
                                {county.municipalities.map((m) => (
                                    <li key={m.municipality} className="armonica-content-item">
                                        <Link href={`/savivaldybes/${m.municipality}`}>
                                            <span className="block info-name">{municipalitiesMap[m.municipality]}</span>
                                            <span className="block info-value">€ {m.total_funds.toLocaleString('lt-LT')}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
            })}
        </div>
    );

};