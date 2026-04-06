import Image from 'next/image';

export const metadata = {
    title: 'Apie mus',
    description: 'Sužinokite apie NIPC — Nevyriausybinių organizacijų informacijos ir paramos centrą, kuris sukūrė šią atvirų duomenų platformą.',
};

export default function AboutUs() {
    return (
        <div className="container pt-12 mt-12">
            <div className="flex flex-wrap justify-center">
                <div className="w-full">
                    <h1 className="title">Apie mus</h1>
                    <div className="content">
                        <p>
                            Nuo 1995 metų veikiantis Nevyriausybinių organizacijų informacijos ir paramos centras (NIPC) nuosekliai siekia stiprinti nevyriausybinių organizacijų (NVO) sektorių Lietuvoje, skatinti filantropijos tradicijas ir didinti visuomenės įsitraukimą į paramos teikimą.
                        </p>
                        <p>
                            Duomenų atvėrimas, jų pateikimas patogiu ir suprantamu formatu bei galimybė atlikti analizes yra vienas iš strateginių NIPC tikslų. Būtent iš šio nuoseklaus darbo gimė ir www.aciujums.lt – atvirų duomenų platforma, skirta didinti NVO sektoriaus skaidrumą, pasitikėjimą ir informacijos prieinamumą.
                        </p>
                        <p>
                            Šios platformos pavadinime telpa daugiau nei žodžiai – tai padėka, bendrystė ir priminimas, kad geri darbai nesibaigia ties deklaracijos forma.
                        </p>
                        <p>
                            Vienas reikšmingiausių NIPC indėlių – iniciatyvos, padėjusios atsirasti galimybei gyventojams skirti dalį savo sumokėto gyventojų pajamų mokesčio (GPM) nevyriausybinėms organizacijoms. 2000–2002 metais NIPC subūrė nacionalinę NVO koaliciją „Už filantropiją", kurios pagrindu Lietuvos Respublikos Seimui buvo pateiktas siūlymas įteisinti šią paramos formą. Ši iniciatyva atlikė didelę įtaką sekantiesiems metams ir buvo pripažinta Lietuvos Respublikos kultūros ministro kolektyvinių prizų 2003 metų dėka.
                        </p>
                        <p>
                            Ši iniciatyva virto realiais pokyčiais – nuo 2004 metų galimybė skirti dalį GPM buvo įtvirtinta įstatyme, o nuo 2005 metų ne pelno organizacijos pradėjo gauti gyventojų paramą. Nuo 2018 metų ši dalis sudaro 1,2 % GPM. Per daugiau nei 15 metų ši sistema tapo svarbia ir plačiai pripažinta priemone, stiprinančia NVO finansinį tvarumą ir skatinančia pilietinį aktyvumą.
                        </p>
                        <p>
                            Vis dėlto laikui bėgant tarp galimų paramos gavėjų atsirado ir kitų ne pelno subjektų (pavyzdžiui, biudžetinės įstaigos, garažų bendrijos ir kitos ne NVO), kas iš dalies iškreipė pirminį šios iniciatyvos tikslą – stiprinti nepriklausomas nevyriausybines organizacijas
                        </p>
                        <p>
                            NIPC nuosekliai siekia, kad paramos sistema išliktų sąžininga ir kryptingai stiprintų būtent nevyriausybinį sektorių. Organizacija teikia siūlymus ir rekomendacijas, prisideda prie sprendimų, kurie didina paramos skaidrumą ir efektyvumą, bei pasisako už tai, kad 1,2 % GPM parama būtų skiriama tik NVO.
                        </p>
                        <p>
                            Šios atviros NVO duomenų bazės sukūrimas – dar vienas svarbus žingsnis siekiant didesnio sektoriaus atvirumo. Platformoje pateikiami duomenys leidžia visuomenei lengviau rasti informaciją apie organizacijas, analizuoti jų veiklą ir priimti informuotus sprendimus skiriant paramą.
                        </p>

                        <h2 id="komanda">Komanda</h2>
                        <ul>
                            <li>Jolita Petraitienė Vadovė <a href="mailto:jolita@nisc.lt">jolita@nisc.lt</a></li>
                            <li>Inga Aksamitauskaitė Viešosios politikos analitikė <a href="mailto:inga@nisc.lt">inga@nisc.lt</a></li>
                            <li>Gabrielė Abromavičiūtė Komunikacijos ekspertė <a href="mailto:gabriele@nisc.lt">gabriele@nisc.lt</a></li>
                        </ul>
                        <h2 id="paremk-mus">Paremk mus</h2>
                        <p>Paremti NIPC įgyvendinamas iniciatyvas galite skirdami savo 1,2% GPM arba paramą pervesdami į NIPC banko sąskaitą SEB banke LT077044060008170670</p>
                        <p>Visą informaciją apie NIPC gautą ir panaudotą paramą bei visas kitas finansines ir veiklos ataskaitas bei auditorių išvadas galite rasti <a href="http://www.3sektorius.lt/nisc/apie-mus/dokumentai/" target="_blank" rel="noopener noreferrer">NIPC tinklapyje</a></p>

                        <h2 id="kontaktai">Kontaktai</h2>
                        <p>Odminių g. 12, Vilnius</p>
                        <p>Pastebėjus netikslumų dėl interneto svetainėje <a href="https://www.aciujums.lt" target="_blank" rel="noopener noreferrer">www.aciujums.lt</a> pateikiamos informacijos, prašome apie tai parašyti el.paštu <a href="mailto:info@nisc.lt">info@nisc.lt</a> Sąrašas sudarytas ir atnaujinamas iš Registrų centro ir Valstybinės mokesčių inspekcijos atvirų duomenų sistemos Nevyriausybinių organizacijų informacijos ir paramos centro (NIPC) iniciatyva.</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col content mt-4">
                <h2>Socialinės iniciatyvos partneriai</h2>
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <a href="http://www.socmin.lrv.lt" target="_blank" rel="noopener noreferrer">
                        <Image src="/images/SADM_logo_h_small.png" alt="Socialinės apsaugos ir darbo ministerijos logotipas" width={220} height={60} style={{ height: 'auto' }} />
                    </a>
                    <a href="http://www.vmi.lt/evmi" target="_blank" rel="noopener noreferrer">
                        <Image src="/images/vmi_small.png" alt="VMI logotipas" width={120} height={60} style={{ height: 'auto' }} />
                    </a>
                    <a href="http://www.registrucentras.lt" target="_blank" rel="noopener noreferrer">
                        <Image src="/images/rc_small.png" alt="Registrų centro logotipas" width={180} height={60} style={{ height: 'auto' }} />
                    </a>
                </div>
            </div>
        </div>
    );
}
