"use client";

import React, { useState, useEffect } from 'react';
import CustomDropdown from '@/components/CustomDropdown';


const SummaryComponent = ({ 
    title,
    totalFunds,
    totalFunders,
    totalRecipients, 
    year, 
    availableYears, 
    onChangeYear 
}) => {

    return (
        <div className="map-info mt-md-2 mt-xl-7">
            <div className="mt-1 mb-1 pl-2 pr-2">
                <h2 id="info-title" className="info-title d-inline-block">{title}</h2>
                <ul className="info-list">
                    <li className="mb-1">
                        <span className="d-block info-name">1,2% GPM Paramos suma</span>
                        <span id="funds-info-value" className="d-block info-value">€ {totalFunds.toLocaleString('lt-LT') }</span></li>
                    <li className="mb-1">
                        <span className="d-block info-name">1,2% GPM paramos teikėjų skaičius</span>
                        <span id="funders-info-value" className="d-block info-value">{totalFunders.toLocaleString('lt-LT')}</span>
                    </li>
                    <li className="mb-1">
                        <span className="d-block info-name">1,2% GPM paramos gavėjų skaičius</span>
                        <span id="recipients-info-value" className="d-block info-value">{totalRecipients.toLocaleString('lt-LT')}</span>
                    </li>
                </ul>
                <span className="d-blok info-name">
                    <CustomDropdown
                        value={availableYears.map(yr => ({ value: yr, label: yr })).find(option => option.value === year)}
                        options={availableYears.map((yr) => ({ value: yr, label: yr }))}
                        onChange={(selection) => onChangeYear(selection.value)}
                        listClassName="clear-bg"
                    /> 
                    metų duomenys</span>
            </div>
        </div>
    );
}


export default SummaryComponent;
