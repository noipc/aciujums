import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({ value, options, onChange, listClassName = '' }) => {
  const [active, setActive] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setActive(!active);
  };

  const handleOptionClick = (option) => {
    onChange(option);
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
      <div className="filter-bar-dropdown-label">
        <input
          type="text"
          className="table-filter filter-bar-dropdown-value"
          readOnly
          value={value}
        />
        <i className="fa fa-chevron-down"></i>
      </div>
      <div className="filter-bar-dropdown-content">
        <ul className={`filter-bar-dropdown-content-list ${listClassName}`}>
          {options.map((option) => (
            <li
              key={option.value || option}
              className="filter-list-item-option"
              onClick={(e) => {
                e.stopPropagation();
                handleOptionClick(option.value || option);
              }}
            >
              {option.label || option}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CustomDropdown;