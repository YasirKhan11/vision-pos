import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';

interface SearchInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (value: string) => void;
    searchLabel: string;
    searchKey: string;
}

export const SearchInputModal = ({ isOpen, onClose, onSearch, searchLabel, searchKey }: SearchInputModalProps) => {
    const [searchValue, setSearchValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchValue('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSearch = () => {
        if (searchValue.trim()) {
            onSearch(searchValue.trim());
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleSearch();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchValue('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Search by ${searchLabel}`} size="medium">
            <div className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                    <div className="text-xs font-black text-primary uppercase tracking-widest mb-2">
                        Search Mode: {searchLabel}
                    </div>
                    <div className="text-[10px] text-slate-500">
                        Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-primary font-bold">{searchKey}</kbd> to activate this search mode
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-[#17316c] uppercase tracking-widest">
                        Enter {searchLabel}
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-lg focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                        placeholder={`Type ${searchLabel.toLowerCase()} and press Enter...`}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold rounded-xl transition-all flex items-center gap-2"
                    >
                        <kbd className="text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200">ESC</kbd>
                        Cancel
                    </button>
                    <button
                        onClick={handleSearch}
                        disabled={!searchValue.trim()}
                        className={`px-8 py-2.5 font-bold rounded-xl transition-all flex items-center gap-2 ${searchValue.trim()
                            ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <kbd className="text-xs bg-black/20 px-1.5 py-0.5 rounded">ENTER</kbd>
                        Search
                    </button>
                </div>
            </div>
        </Modal>
    );
};
