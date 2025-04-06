'use client';
import { Suspense } from 'react';
import SearchClient from '@/components/SearchClient';

export default function PaieskaPage() {
    return (
        <Suspense fallback={<div>Įkeliama...</div>}>
            <SearchClient />
        </Suspense>
    );
}