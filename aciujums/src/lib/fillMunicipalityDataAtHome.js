import { useEffect } from 'react';

export function FillMunicipalityData({ data }) {
    useEffect(() => {
        if (!data) return;

        let totalFundsSum = 0;
        let totalFundersSum = 0;
        let totalRecipientsCount = 0;

        data.forEach((entry) => {
            // totalFundsSum += entry.total_funds || 0;
            // totalFundersSum += entry.total_funders || 0;
            // totalRecipientsCount += entry.total_recipients || 0;

            const elements = document.querySelectorAll('.armonica-content-item');

            elements.forEach((item) => {
                const nameElement = item.querySelector('.info-name');
                const valueElement = item.querySelector('.info-value');
                const linkElement = item.querySelector('a');

                if (nameElement && linkElement) {
                    const hrefSlug = linkElement.getAttribute('href').split('/').pop();
                    const entrySlug = entry.municipality
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/\p{Diacritic}/gu, '')
                        .replace(/ /g, '-');

                    if (hrefSlug === entrySlug) {
                        valueElement.textContent = `€ ${entry.total_funds.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }
                }
            });
        });

        // Fill the aggregated data
        // const fundsInfoElement = document.getElementById('funds-info-value');
        // const fundersInfoElement = document.getElementById('funders-info-value');
        // const recipientsInfoElement = document.getElementById('recipients-info-value');

        // if (fundsInfoElement) {
        //     fundsInfoElement.textContent = `€ ${totalFundsSum.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        // }

        // if (fundersInfoElement) {
        //     fundersInfoElement.textContent = `${totalFundersSum.toLocaleString('lt-LT')}`;
        // }

        // if (recipientsInfoElement) {
        //     recipientsInfoElement.textContent = `${totalRecipientsCount.toLocaleString('lt-LT')}`;
        // }
    }, [data]);

    return null;
}
