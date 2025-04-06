'use client';
import Link from 'next/link';
import { useEffect } from 'react';

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

    return (
        <div className="header">
            <div className="logo">
                <span className="d-block logo-circle"></span>
                <h1>
                    <a href="https://www.aciujums.lt">Ačiū jums!</a>
                </h1>
            </div>
            <div id="main-menu" className="main-menu">
                <ul>
                    <li>
                        <form id="ajSearch" action="/paieska" method="GET" className="form-inline nav-form">
                            <div className="d-inline-block search-input-wrapper">
                                <input type="text" name="ieskoti" id="searchInput" className="search-input" placeholder="Ieškoti organizacijų..." />
                                <i id="searchInputCloseBtn" className="d-inline-block fas fa-times"></i>
                            </div>
                            <button id="searchLink" className="btn-circle btn-search" type="submit" aria-label="Search Link">
                                <i className="fas fa-search fa-2x"></i>
                            </button>
                        </form>
                    </li>
                    <li>
                        <button id="menuButton" className="btn-circle" type="button" aria-label="Main Menu Link">
                            <i className="fas fa-bars fa-2x"></i>
                            <i className="fas fa-times fa-2x d-none"></i>
                        </button>
                    </li>
                </ul>
                <div id="menuDropDown" className="card menu-drop-down">
                    <ul>
                        <li className="menu-item-paieska"><Link href="/paieska"><span>Paieška</span></Link></li>
                        <li className="menu-item-apie mus"><Link href="/apie-mus"><span>Apie mus</span></Link></li>
                        <li className="menu-item-naujienos"><Link href="/naujienos"><span>Naujienos</span></Link></li>
                        <li className="menu-item-naudinga informacija"><Link href="/naudinga-informacija"><span>Naudinga informacija</span></Link></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
