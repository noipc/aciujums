import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({ value, options, onChange, listClassName = '', isInputWide = false}) => {
    const [active, setActive] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => {
        setActive(!active);
    };

    const handleOptionClick = (option) => {
        onChange(option); // full option object passed back
        setActive(false);
    };

    // Close dropdown if clicking outside.
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setActive(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div
            className={`filter-bar-dropdown ${active ? 'active' : ''}`}
            onClick={toggleDropdown}
            ref={dropdownRef}
        >
            <div className={`filter-bar-dropdown-label ${listClassName}`}>
                <input
                    type="text"
                    className={`table-filter filter-bar-dropdown-value ${isInputWide ? "wide-input" : ""}`}
                    readOnly
                    value={value?.label || ''} // 💥 Show the label, not the object!
                />
                <i className="fa fa-chevron-down"></i>
            </div>
            <div className={`filter-bar-dropdown-content ${listClassName}`}>
                <ul className="filter-bar-dropdown-content-list">
                    {Array.isArray(options) && options.map((option) => (
                        <li
                            key={option.value}
                            className="filter-list-item-option"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOptionClick(option); // 💥 Pass the full object
                            }}
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
