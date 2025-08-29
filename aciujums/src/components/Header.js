'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import SearchDropdown from './SearchDropdown';

export default function Header() {
    useEffect(() => {
        const menuButton = document.getElementById('menuButton');
        const menuDropDown = document.getElementById('menuDropDown');

        if (!menuButton || !menuDropDown) return;

        menuButton.addEventListener('click', () => {
            const isActive = menuButton.classList.contains('is-active');
            menuButton.classList.toggle('is-active');

            const barsIcon = menuButton.querySelector('.fa-bars');
            const timesIcon = menuButton.querySelector('.fa-times');
            barsIcon?.classList.toggle('d-none');
            timesIcon?.classList.toggle('d-none');

            if (isActive) {
                menuDropDown.classList.remove('d-block');
            } else {
                menuDropDown.classList.add('d-block');
            }
        });
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            const menuButton = document.getElementById('menuButton');
            const menuDropDown = document.getElementById('menuDropDown');

            if (!menuButton || !menuDropDown) return;

            if (
                !menuButton.contains(event.target) &&
                !menuDropDown.contains(event.target)
            ) {
                if (menuButton.classList.contains('is-active')) {
                    // Remove active classes and show bars icon
                    menuButton.classList.remove('is-active');
                    menuDropDown.classList.remove('d-block');

                    const barsIcon = menuButton.querySelector('.fa-bars');
                    const timesIcon = menuButton.querySelector('.fa-times');
                    if (barsIcon) barsIcon.classList.remove('d-none');
                    if (timesIcon) timesIcon.classList.add('d-none');
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="header">
            <div className="logo">
                <span className="d-block logo-circle"></span>
                <h1>
                    <a href="https://www.aciujums.lt">Ačiū jums!</a>
                </h1>
            </div>
            <div id="main-menu" className="main-menu">
                <SearchDropdown />
                <button id="menuButton" className="btn-circle" type="button" aria-label="Main Menu Link">
                    <i className="fas fa-bars fa-2x"></i>
                    <i className="fas fa-times fa-2x d-none"></i>
                </button>
                <div id="menuDropDown" className="card menu-drop-down">
                    <ul>
                        <li className="menu-item-paieska"><Link href="/paieska"><span>Paieška</span></Link></li>
                        <li className="menu-item-apie mus"><Link href="/apie-mus"><span>Apie mus</span></Link></li>
                        <li className="menu-item-naujienos"><Link href="/naujienos"><span>Naujienos</span></Link></li>
                        <li className="menu-item-naudinga informacija"><Link href="/naudinga-informacija"><span>Naudinga informacija</span></Link></li>
                    </ul>
                </div>
            </div>
        </header>
    );
}
