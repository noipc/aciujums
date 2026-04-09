export const metadata = {
    title: 'Naudinga informacija',
    description: 'Teisinė bazė, tyrimai ir statistika apie 1,2% GPM paramos sistemą Lietuvoje.',
};

export default function UsefulInfo() {
    return (
        <div className="container pt-12 mt-12">
            <div className="flex flex-wrap justify-start">
                <div className="w-full md:w-2/3">
                    <h1 className="title">Naudinga informacija</h1>
                    <div className="content">
                        <h2 id="teisinė-bazė">Teisinė bazė</h2>
                        <ul>
                            <li><a href="https://e-seimas.lrs.lt/portal/legalActEditions/lt/TAD/TAIS.5483" target="_blank" rel="noopener noreferrer">Labdaros
                                ir paramos įstatymas</a></li>
                            <li><a href="https://e-seimas.lrs.lt/portal/legalActEditions/lt/TAD/TAIS.171369?faces-redirect=true"
                                target="_blank" rel="noopener noreferrer">Gyventojų pajamų mokesčio įstatymas</a></li>
                            <li><a href="https://e-seimas.lrs.lt/portal/legalActEditions/lt/TAD/TAIS.157066" target="_blank" rel="noopener noreferrer">Pelno
                                mokesčio įsatymas</a></li>
                        </ul>
                        <h2 id="tyrimai-ir-komentarai">Tyrimai ir komentarai</h2>
                        <ul>
                            <li><a href="http://www.3sektorius.lt/docs/NVOteisin%C4%97aplinka_tyrimas_2021_2021-09-13_13:11:18.pdf"
                                target="_blank" rel="noopener noreferrer">Tyrimas „Nevyriausybinių organizacijų teisinė aplinka" (2021, NVO teisės
                                institutas, NIPC)</a></li>
                            <li><a href="http://www.3sektorius.lt/docs/210609NVO-mokestine-aplinka_2021-09-13_13:04:25.pdf"
                                target="_blank" rel="noopener noreferrer">Analizė „NVO atskaitomybė ir mokestinės lengvatos" (2021, NVO teisės institutas,
                                NIPC)</a></li>
                            <li><a href="http://www.3sektorius.lt/docs/210507Tyrimas_vie%C5%A1ieji-ir-privat%C5%ABs-JA_2021-09-13_13:09:02.pdf"
                                target="_blank" rel="noopener noreferrer">Analizė „NVO yra (turi būti) viešieji ar privatūs juridiniai asmenys?" (2021,
                                NVO teisės institutas, NIPC)</a></li>
                        </ul>
                        <h2 id="paramos-teikimo-statistika">Paramos teikimo statistika</h2>
                        <ul>
                            <li><a href="https://osp.stat.gov.lt/labdara-ir-parama" target="_blank" rel="noopener noreferrer">Statistikos departamentas</a></li>
                            <li><a href="https://www.vmi.lt/evmi/-/vmi-paramos-gav-c4-99jams-netrukus-perves-21-1-mln.-eur-c5-b3"
                                target="_blank" rel="noopener noreferrer">VMI</a></li>
                            <li><a href="http://www.3sektorius.lt/labdara-parama/paramos-statistika/"
                                target="_blank" rel="noopener noreferrer">3sektorius.lt</a></li>
                        </ul>
                        <h2 id="situacijos-apžvalga">Situacijos apžvalga</h2>
                        <p><a href="http://www.3sektorius.lt/docs/NVO_skaiciais_2021_2021-09-14_12:20:59.pdf"
                            target="_blank" rel="noopener noreferrer">Nevyriausybinės organizacijos skaičiais 1990-2020 metais (NIPC duomenys)</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
