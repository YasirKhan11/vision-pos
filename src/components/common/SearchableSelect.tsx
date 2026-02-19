import React, { useState, useRef, useEffect } from 'react';

export const SearchableSelect = ({ options, value, onChange, placeholder, disabled = false, label }: { options: any[], value: string | null, onChange: (val: string) => void, placeholder: string, disabled?: boolean, label: string }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredOptions = options.filter((opt: any) => opt.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const selectedOption = options.find((opt: any) => opt.id === value);

    const handleSelect = (option: any) => {
        onChange(option.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="form-group" ref={wrapperRef}>
            <label>{label}</label>
            <div className="search-select-wrapper">
                <button
                    type="button"
                    className="form-control search-select-input"
                    onClick={() => {
                        if (!disabled) {
                            setIsOpen(!isOpen);
                            if (!isOpen) setTimeout(() => inputRef.current?.focus(), 0);
                        }
                    }}
                    disabled={disabled}
                >
                    {selectedOption ? selectedOption.name : <span className="placeholder">{placeholder}</span>}
                    <span className="search-select-arrow">▼</span>
                </button>
                {isOpen && (
                    <div className="search-select-dropdown">
                        <input
                            ref={inputRef}
                            type="text"
                            className="search-select-filter"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        <ul className="search-select-list">
                            {filteredOptions.length > 0 ? filteredOptions.map(option => (
                                <li key={option.id} onMouseDown={() => handleSelect(option)}>
                                    {option.name}
                                </li>
                            )) : (
                                <li className="no-results">No results found</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
