import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product } from '../../types/domain.types';
import { Modal } from '../common/Modal';
import { api } from '../../api';
import { transformApiProduct } from '../../utils/transformers';
import { USE_MOCK_DATA, MOCK_PRODUCTS } from '../../data/mockData';
import { formatCurrency } from '../../utils/formatters';

export const ProductSearchWithKeyboardModal = ({ isOpen, onClose, onSelectProduct }: { isOpen: boolean, onClose: () => void, onSelectProduct: (p: Product) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load products from API when modal opens
    useEffect(() => {
        const loadProducts = async () => {
            if (USE_MOCK_DATA) return;

            setLoading(true);
            try {
                const data = await api.products.getAll({
                    pageno: 1,
                    include_stock_image: true,
                    recordsperpage: 500
                });
                const transformed = data.map(transformApiProduct);
                if (transformed.length > 0) {
                    setProducts(transformed);
                }
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            loadProducts();
        }
    }, [isOpen]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) {
            return products.slice(0, 100); // Limit initial display
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return products.filter(p =>
            p.description.toLowerCase().includes(lowerCaseSearchTerm) ||
            p.id.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [searchTerm, products]);

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

    const handleSelectAndClose = (product: Product) => {
        setSearchTerm('');
        onSelectProduct(product);
    };

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setActiveId(null);
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
        <Modal isOpen={isOpen} onClose={onClose} title="Stock Item Search" size="xlarge">
            <div className="flex flex-col h-[75vh] bg-slate-50 overflow-hidden font-sans">
                <div className="flex-1 flex flex-col p-8 overflow-hidden">
                    <div className="mb-6 relative group">
                        <input
                            ref={inputRef}
                            type="text"
                            className="h-20 w-full bg-white border-2 border-slate-100 rounded-3xl px-8 text-2xl font-black text-slate-800 placeholder:text-slate-200 focus:border-primary/40 focus:shadow-2xl focus:shadow-primary/5 transition-all outline-none"
                            placeholder="Search for products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-slate-100 border-t-primary rounded-full animate-spin" />
                            ) : (
                                <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Ready</span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-black/[0.02] relative">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-md z-10 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Item Code</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredProducts.map(product => (
                                    <tr
                                        key={product.id}
                                        className={`group cursor-pointer transition-all ${product.id === activeId ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50'}`}
                                        onClick={() => { setActiveId(product.id); handleSelectAndClose(product); }}
                                        tabIndex={0}
                                    >
                                        <td className="px-8 py-5 text-sm font-black text-slate-500 tabular-nums">{product.id}</td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{product.description}</td>
                                        <td className="px-8 py-5 text-right text-sm font-black text-primary tabular-nums">{formatCurrency(product.price)}</td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                                <span className="text-6xl opacity-20">🔎</span>
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">No products found</span>
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
