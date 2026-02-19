import React from 'react';
import { Product } from '../../types/domain.types';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/formatters';

export const PartDetailModal = ({ isOpen, onClose, onAddToCart, part }: {
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (part: Product) => void;
    part: Product | null;
}) => {
    if (!part) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Component Specification Data" size="large" footerContent={
            <div className="flex justify-end gap-6 p-2">
                <button className="px-8 py-4 bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95" onClick={onClose}>Dismiss</button>
                <button className="px-10 py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all" onClick={() => onAddToCart(part)}>Initialize Acquisition</button>
            </div>
        }>
            <div className="flex flex-col md:flex-row gap-12 p-10 bg-white">
                <div className="w-full md:w-[40%] aspect-square bg-slate-50 rounded-[3rem] border-4 border-slate-100 overflow-hidden flex items-center justify-center text-slate-300 relative shadow-inner">
                    {part.image && (
                        <img src={part.image} alt={part.description} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Part Catalog</span>
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-10">
                    <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                        <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-4">{part.description}</h3>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Integrated Component</p>

                        <div className="mt-10 pt-10 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Unit Price</span>
                            <span className="text-4xl font-black text-slate-800 tracking-tighter tabular-nums">{formatCurrency(part.price)}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] ml-4">Technical Attributes</h4>
                        {part.attributes && Object.keys(part.attributes).length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(part.attributes).map(([key, value]) => (
                                    <div key={key} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key}</span>
                                        <span className="text-sm font-bold text-slate-700">{value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center p-10 bg-slate-50 rounded-3xl text-[10px] font-black text-slate-300 uppercase tracking-widest">No metadata discovered</p>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
