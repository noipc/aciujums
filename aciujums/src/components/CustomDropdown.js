'use client';
import React, { useState, useRef, useEffect, useId } from 'react';

const CustomDropdown = ({ value, options, onChange, listClassName = '', isInputWide = false, className = '' }) => {
    const [active, setActive] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const listRef = useRef(null);
    const id = useId();
    const listId = `dropdown-list-${id}`;

    const open = () => { setActive(true); setFocusedIndex(options.findIndex(o => o.value === value?.value)); };
    const close = () => { setActive(false); setFocusedIndex(-1); };

    const handleSelect = (option) => {
        onChange(option);
        close();
    };

    const handleKeyDown = (e) => {
        if (!active) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                open();
            }
            return;
        }
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < options.length) {
                handleSelect(options[focusedIndex]);
            }
        } else if (e.key === 'Tab') {
            close();
        }
    };

    // Scroll focused option into view
    useEffect(() => {
        if (active && focusedIndex >= 0 && listRef.current) {
            const item = listRef.current.children[focusedIndex];
            item?.scrollIntoView({ block: 'nearest' });
        }
    }, [focusedIndex, active]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) close();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            className={`filter-bar-dropdown ${active ? 'active' : ''} ${className}`}
            ref={dropdownRef}
        >
            <div
                className={`filter-bar-dropdown-label ${listClassName}`}
                role="combobox"
                aria-expanded={active}
                aria-haspopup="listbox"
                aria-controls={listId}
                tabIndex={0}
                onClick={() => (active ? close() : open())}
                onKeyDown={handleKeyDown}
            >
                <input
                    type="text"
                    className={`table-filter filter-bar-dropdown-value ${isInputWide ? 'wide-input' : ''}`}
                    readOnly
                    tabIndex={-1}
                    value={value?.label || ''}
                    aria-hidden="true"
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                </svg>
            </div>
            <div className={`filter-bar-dropdown-content ${listClassName}`}>
                <ul
                    id={listId}
                    role="listbox"
                    ref={listRef}
                    className="filter-bar-dropdown-content-list"
                    aria-label="Pasirinkimas"
                >
                    {Array.isArray(options) && options.map((option, index) => (
                        <li
                            key={option.value}
                            role="option"
                            aria-selected={option.value === value?.value}
                            className={`filter-list-item-option${focusedIndex === index ? ' focused' : ''}`}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(option); }}
                            onMouseEnter={() => setFocusedIndex(index)}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CustomDropdown;
