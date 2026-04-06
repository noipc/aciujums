'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import SearchDropdown from './SearchDropdown';

const MobileSearchOverlay = dynamic(() => import('./MobileSearchOverlay'), { ssr: false });

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const menuRef = useRef(null);

    function toggleMenu() { setMenuOpen((v) => !v); }
    function openSearch() { setMenuOpen(false); setSearchOpen(true); }
    function closeSearch() { setSearchOpen(false); }

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <header className="header">
                <div className="logo">
                    <span className="block logo-circle"></span>
                    <h1>
                        <a href="/">Ačiū jums!</a>
                    </h1>
                </div>
                <div id="main-menu" className="main-menu" ref={menuRef}>
                    <SearchDropdown />
                    <button
                        type="button"
                        className="btn-circle btn-circle--mobile-search"
                        onClick={openSearch}
                        aria-label="Atidaryti paiešką"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M21.71 20.29l-4.645-4.645A8.5 8.5 0 1 0 15.95 16.9l4.645 4.646a1 1 0 0 0 1.414-1.414zM10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z"/>
                        </svg>
                    </button>
                    <button
                        id="menuButton"
                        className={`btn-circle${menuOpen ? ' is-active' : ''}`}
                        type="button"
                        aria-label={menuOpen ? 'Uždaryti meniu' : 'Atidaryti meniu'}
                        aria-expanded={menuOpen}
                        aria-controls="menuDropDown"
                        onClick={toggleMenu}
                    >
                        <span className={`icon-bars${menuOpen ? ' hidden' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <rect y="4" width="24" height="2" rx="1"/><rect y="11" width="24" height="2" rx="1"/><rect y="18" width="24" height="2" rx="1"/>
                            </svg>
                        </span>
                        <span className={`icon-close${menuOpen ? '' : ' hidden'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/>
                            </svg>
                        </span>
                    </button>
                    <div id="menuDropDown" className={`menu-drop-down${menuOpen ? ' block' : ''}`}>
                        <ul>
                            <li className="menu-item-apie-mus"><Link href="/apie-mus"><span>Apie mus</span></Link></li>
                            <li className="menu-item-naudinga-informacija"><Link href="/naudinga-informacija"><span>Naudinga informacija</span></Link></li>
                        </ul>
                    </div>
                </div>
            </header>
            {searchOpen && <MobileSearchOverlay onClose={closeSearch} />}
        </>
    );
}
