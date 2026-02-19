import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Customer } from '../../types/domain.types';

export const CustomerSearchWithKeyboardModal = ({ isOpen, onClose, onSelectCustomer, customers }: { isOpen: boolean, onClose: () => void, onSelectCustomer: (c: Customer) => void, customers: Customer[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) {
            return customers.slice(0, 100); // Limit initial display
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            c.id.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [searchTerm, customers]);

    const handleKeyClick = (key: string) => {
        let newSearchTerm = searchTerm;
        if (key === 'Backspace') {
            newSearchTerm = searchTerm.slice(0, -1);
        } else if (key === 'Space') {
            newSearchTerm += ' ';
        } else if (key.length === 1) { // Regular character keys
            newSearchTerm += key;
        }
        setSearchTerm(newSearchTerm);
        inputRef.current?.focus();
    };

    const handleSelectAndClose = (customer: Customer) => {
        setSearchTerm('');
        onSelectCustomer(customer);
    };

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const keyboardLayout = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
        ['Space']
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Strategic Client Locator" size="xlarge">
            <div className="flex flex-col h-[75vh] bg-slate-50 overflow-hidden font-sans">
                <div className="flex-1 flex flex-col p-8 overflow-hidden">
                    <div className="mb-6 relative group">
                        <input
                            ref={inputRef}
                            type="text"
                            className="h-20 w-full bg-white border-2 border-slate-100 rounded-3xl px-8 text-2xl font-black text-slate-800 placeholder:text-slate-200 focus:border-success/40 focus:shadow-2xl focus:shadow-success/5 transition-all outline-none"
                            placeholder="Identify procurement account..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="text-[10px] font-black text-success/40 uppercase tracking-widest">Global Directory Active</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-black/[0.02] relative">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-md z-10 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Account UID</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Legal Identity</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Contact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredCustomers.map(customer => (
                                    <tr
                                        key={customer.id}
                                        className="group cursor-pointer transition-all hover:bg-success/5 border-l-4 border-l-transparent hover:border-l-success"
                                        onClick={() => handleSelectAndClose(customer)}
                                        tabIndex={0}
                                    >
                                        <td className="px-8 py-5 text-sm font-black text-slate-500 tabular-nums">{customer.id}</td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-800 group-hover:text-success transition-colors">{customer.name}</td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-400 italic tabular-nums">{customer.phone}</td>
                                    </tr>
                                ))}
                                {filteredCustomers.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                                <span className="text-6xl opacity-20">👥</span>
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">No target accounts identified</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cyberpunk Style Virtual Keyboard */}
                <div className="bg-slate-900 px-8 py-10 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] border-t border-white/5">
                    <div className="flex flex-col gap-3 max-w-5xl mx-auto">
                        {keyboardLayout.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex justify-center gap-2">
                                {row.map(key => (
                                    <button
                                        key={key}
                                        className={`
                                            h-16 flex items-center justify-center transition-all duration-200 active:scale-90 font-black text-sm rounded-2xl border
                                            ${key === 'Space' ? 'flex-1 max-w-md bg-white/5 border-white/10 text-white hover:bg-white/10' :
                                                key === 'Backspace' ? 'w-24 bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' :
                                                    'w-16 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'}
                                        `}
                                        onClick={() => handleKeyClick(key)}
                                    >
                                        {key === 'Backspace' ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.12c.36.53.9.88 1.59.88h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3.7 13.3a.996.996 0 0 1-1.41 0L14 13.41l-2.89 2.89a.996.996 0 1 1-1.41-1.41L12.59 12 9.7 9.11a.996.996 0 1 1 1.41-1.41L14 10.59l2.89-2.89a.996.996 0 1 1 1.41 1.41L15.41 12l2.89 2.89c.38.38.38 1.02 0 1.41z"></path></svg>
                                        ) : key === 'Space' ? (
                                            <span className="text-[10px] tracking-[0.5em] opacity-40">S P A C E</span>
                                        ) : key}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
