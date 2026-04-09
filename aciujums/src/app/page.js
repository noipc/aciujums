import HomeInteractive from '@/components/HomeInteractive';

export const metadata = {
    title: 'Atvira 1,2% GPM duomenų bazė',
    description: 'Peržiūrėkite, kokioms organizacijoms Lietuvos gyventojai skiria 1,2% GPM paramą. Interaktyvi žemėlapis ir savivaldybių statistika.',
};

export default function Home() {
    return (
        <div className="mx-auto mt-5 container">
            <h1 className="h2 text-center mt-100">Atvira 1,2% GPM duomenų bazė</h1>
            <HomeInteractive />
        </div>
    );
}
