const municipalityCountyMap = {
    "alytaus-miesto-savivaldybe"    : "alytaus-apskritis",
    "alytaus-rajono-savivaldybe"    : "alytaus-apskritis",
    "druskininku-savivaldybe"       : "alytaus-apskritis",
    "lazdiju-rajono-savivaldybe"    : "alytaus-apskritis",
    "varenos-rajono-savivaldybe"    : "alytaus-apskritis",
    "birstono-savivaldybe"          : "kauno-apskritis",
    "jonavos-rajono-savivaldybe"    : "kauno-apskritis",
    "kaisiadoriu-rajono-savivaldybe": "kauno-apskritis",
    "kauno-miesto-savivaldybe"      : "kauno-apskritis",
    "kauno-rajono-savivaldybe"      : "kauno-apskritis",
    "kedainiu-rajono-savivaldybe"   : "kauno-apskritis",
    "prienu-rajono-savivaldybe"     : "kauno-apskritis",
    "raseiniu-rajono-savivaldybe"   : "kauno-apskritis",
    "klaipedos-miesto-savivaldybe"  : "klaipedos-apskritis",
    "klaipedos-rajono-savivaldybe"  : "klaipedos-apskritis",
    "kretingos-rajono-savivaldybe"  : "klaipedos-apskritis",
    "neringos-savivaldybe"          : "klaipedos-apskritis",
    "palangos-miesto-savivaldybe"   : "klaipedos-apskritis",
    "silutes-rajono-savivaldybe"    : "klaipedos-apskritis",
    "skuodo-rajono-savivaldybe"     : "klaipedos-apskritis",
    "kalvarijos-savivaldybe"        : "marijampoles-apskritis",
    "kazlu-rudos-savivaldybe"       : "marijampoles-apskritis",
    "marijampoles-savivaldybe"      : "marijampoles-apskritis",
    "sakiu-rajono-savivaldybe"      : "marijampoles-apskritis",
    "vilkaviskio-rajono-savivaldybe": "marijampoles-apskritis",
    "birzu-rajono-savivaldybe"      :"panevezio-apskritis",
    "kupiskio-rajono-savivaldybe"   :"panevezio-apskritis",
    "panevezio-miesto-savivaldybe"  :"panevezio-apskritis",
    "panevezio-rajono-savivaldybe"  :"panevezio-apskritis",
    "pasvalio-rajono-savivaldybe"   :"panevezio-apskritis",
    "rokiskio-rajono-savivaldybe"   :"panevezio-apskritis",
    "akmenes-rajono-savivaldybe"    :"siauliu-apskritis",
    "joniskio-rajono-savivaldybe"   :"siauliu-apskritis", 
    "kelmes-rajono-savivaldybe"     :"siauliu-apskritis", 
    "pakruojo-rajono-savivaldybe"   :"siauliu-apskritis", 
    "radviliskio-rajono-savivaldybe":"siauliu-apskritis", 
    "siauliu-miesto-savivaldybe"    :"siauliu-apskritis", 
    "siauliu-rajono-savivaldybe"    :"siauliu-apskritis", 
    "jurbarko-rajono-savivaldybe"   :"taurages-apskritis",
    "pagegiu-savivaldybe"           :"taurages-apskritis", 
    "silales-rajono-savivaldybe"    :"taurages-apskritis",
    "taurages-rajono-savivaldybe"   :"taurages-apskritis",
    "mazeikiu-rajono-savivaldybe"   :"telsiu-apskritis",
    "plunges-rajono-savivaldybe"    :"telsiu-apskritis",
    "rietavo-savivaldybe"           :"telsiu-apskritis",
    "telsiu-rajono-savivaldybe"     :"telsiu-apskritis",
    "anyksciu-rajono-savivaldybe"   :"utenos-apskritis",
    "ignalinos-rajono-savivaldybe"  :"utenos-apskritis",
    "moletu-rajono-savivaldybe"     :"utenos-apskritis",
    "utenos-rajono-savivaldybe"     :"utenos-apskritis",
    "visagino-savivaldybe"          :"utenos-apskritis", 
    "zarasu-rajono-savivaldybe"     :"utenos-apskritis", 
    "elektrenu-savivaldybe"         :"vilniaus-apskritis", 
    "salcininku-rajono-savivaldybe" :"vilniaus-apskritis",  
    "sirvintu-rajono-savivaldybe"   :"vilniaus-apskritis",  
    "svencioniu-rajono-savivaldybe" :"vilniaus-apskritis",  
    "traku-rajono-savivaldybe"      :"vilniaus-apskritis",  
    "ukmerges-rajono-savivaldybe"   :"vilniaus-apskritis",  
    "vilniaus-miesto-savivaldybe"   :"vilniaus-apskritis",  
    "vilniaus-rajono-savivaldybe"   :"vilniaus-apskritis"
}

const counties = [
    { name: "Alytaus apskritis", slug: "alytaus-apskritis" },
    { name: "Kauno apskritis", slug: "kauno-apskritis" },
    { name: "Klaipėdos apskritis", slug: "klaipedos-apskritis" },
    { name: "Marijampolės apskritis", slug: "marijampoles-apskritis" },
    { name: "Panevėžio apskritis", slug: "panevezio-apskritis" },
    { name: "Šiaulių apskritis", slug: "siauliu-apskritis" },
    { name: "Tauragės apskritis", slug: "taurages-apskritis" },
    { name: "Telšių apskritis", slug: "telsiu-apskritis" },
    { name: "Utenos apskritis", slug: "utenos-apskritis" },
    { name: "Vilniaus apskritis", slug: "vilniaus-apskritis" },
];

export default function groupByCounty(municipalities) {
    // Start with county skeletons
    const result = counties.map((c) => ({
        ...c,
        municipalities: [],
    }));

    

    // Quick helper to find the right county object
    const bySlug = Object.fromEntries(
        result.map((c) => [c.slug, c])
    );

    

    // Distribute municipalities into those buckets
    municipalities.forEach((m) => {
        const countySlug = municipalityCountyMap[m.municipality];
        if (!countySlug) {
            console.warn(`Unknown municipality → county mapping for ${m.municipality}`);
            return;
        }
        bySlug[countySlug].municipalities.push(m);
    });

    // Optional: sort municipalities alphabetically
    result.forEach((c) =>  c.municipalities.sort((a, b) => a.municipality.localeCompare(b.municipality)));

    return result;
}