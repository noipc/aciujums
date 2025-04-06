export default function AboutUs() {
    return (
        <div className="container pt-5 mt-5">
            <div className="row justify-content-center">
                <div className="col-12">
                    <h2 className="title">Apie mus</h2>
                    <div className="content">
                        <h2 id="organizacija">Organizacija</h2>
                        <p>Šis specializuotas tinklalapis – atvira duomenų bazė yra Nevyriausybinių organizacijų informacijos ir paramos centro (NIPC) veikiančio nuo 1995 m. ilgamečio darbo siekiant stiprinti nevyriausybinių organizacijų sektorių ir skatinti filantropijos tradicijas Lietuvoje rezultatas.</p>
                        <p>NIPC 2000-2002 metais buvo subūręs nacionalinę NVO koaliciją “Už filantropiją”, kurios pagrindu LR Seimui buvo pateiktas pasiūlymas įteisinti galimybę gyventojams skirti 2% nuo sumokėto GPM savanoriškais pasirinktai nevyriausybinėms organizacijoms.</p>
                        <p>2004 metais tokia galimybė Gyventojų pajamų mokesčio įstatyme atsirado ir nuo 2005 metų visos ne pelno organizacijos turi galimybę iš gyventojų gauti 2% (o nuo 2018 metų – 1,2%) GPM dalį.</p>
                        <p>Taigi, jau daugiau kaip 15 metų veikianti sistema yra vertinama palankiai tiek politikų, tiek gyventojų, tiek ir paramos gavėjų, o 2021 m. spalio 27 d. po NIPC nuolatinių pasiūlymų ir rekomendacijų teikimo tikėtina, kad bus pasiektas ilgai lauktas sprendimas ir 1,2% GPM galės gauti tik NVO. Vyriausybė priėmė teigiamą sprendimą, įstatymo pataisa šiuo metu svarstoma Seime. Daugiau informacijos <a href="https://bit.ly/3jJvA4P" target="_blank">čia</a> (9 klausimas)</p>
                        <p> NIPC nuosekliai dirba siekiant gerinti NVO teisinę aplinką, veiklos skaidrumą ir atskaitomybę. Duomenų atvėrimas bei jų pateikimas naudotojams draugišku formatu su galimybe atlikti analizes tai strateginis NIPC veiklos tikslas.</p>

                        <h2 id="komanda">Komanda</h2>
                        <ul>
                            <li>Olia Žuravliova Vadovė <a href="mailto:olia@nisc.lt">olia@nisc.lt</a></li>
                            <li>Martinas Žaltauskas Viešosios politikos analitikas <a href="mailto:martinas@nisc.lt">martinas@nisc.lt</a></li>
                            <li>Inga Aksamitauskaitė Komunikacijos vadovė <a href="mailto:inga@nisc.lt">inga@nisc.lt</a></li>
                        </ul>
                        <h2 id="paremk-mus">Paremk mus</h2>
                        <p>Paremti NIPC įgyvendinamas iniciatyvas galite skirdami savo 1,2% GPM arba paramą pervesdami į NIPC banko sąskaitą SEB banke LT077044060008170670</p>
                        <p>Visą informaciją apie NIPC gautą ir panaudotą paramą bei visas kitas finansines ir veiklos ataskaitas bei auditorių išvadas galite rasti <a href="http://www.3sektorius.lt/nisc/apie-mus/dokumentai/" target="_blank">NIPC tinklapyje</a></p>

                        <h2 id="kontaktai">Kontaktai</h2>
                        <p>Odminių g. 12, Vilnius</p>
                        <p>Pastebėjus netikslumų dėl interneto svetainėje <a href="https://www.aciujums.lt" target="_blank">www.aciujums.lt</a> pateikiamos informacijos, prašome apie tai parašyti el.paštu <a href="mailto:info@nisc.lt">info@nisc.lt</a> Sąrašas sudarytas ir atnaujinamas iš Registrų centro ir Valstybinės mokesčių inspekcijos atvirų duomenų sistemos Nevyriausybinių organizacijų informacijos ir paramos centro (NIPC) iniciatyva.</p>
                    </div>
                </div>
            </div>
            <div className="d-flex flex-column content mt-3">
                <h2>Socialinės iniciatyvos partneriai</h2>
                <div className="d-flex flex-column flex-md-row align-items-center justify-content-between">
                    <a href="http://www.socmin.lrv.lt" target="_blank" rel="noopener noreferrer">
                        <img src="/images/SADM_logo_h_small.png" alt="Socialinės apsaugos ir darbo ministerijos logtipas" width="220"></img>
                    </a>
                    <a href="http://www.vmi.lt/evmi" target="_blank" rel="noopener noreferrer">
                        <img src="/images/vmi_small.png" alt="VMI logotipas" width="120"></img>
                    </a>
                    <a href="http://www.registrucentras.lt" target="_blank" rel="noopener noreferrer">
                        <img src="/images/rc_small.png" alt="Registrų centro logotipas" width="180"></img>
                    </a>
                </div>
            </div>
        </div>
    )
}