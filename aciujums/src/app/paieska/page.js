import { Suspense } from 'react';
import SearchClient from '@/components/SearchClient';

export const metadata = {
    title: 'Paieška',
    description: 'Ieškokite NVO ir paramos gavėjų pagal pavadinimą arba įmonės kodą.',
};

export default function PaieskaPage() {
    return (
        <Suspense fallback={<div>Įkeliama...</div>}>
            <SearchClient />
        </Suspense>
    );
}
