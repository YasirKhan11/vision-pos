import React from 'react';
import { Product } from '../../types/domain.types';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/formatters';

export const ProductDetailModal = ({ isOpen, onClose, product }: {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}) => {
    if (!product) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Strategic Inventory Analysis" size="large" footerContent={
            <div className="flex justify-end p-2">
                <button className="px-12 py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all" onClick={onClose}>Acknowledge Specifications</button>
            </div>
        }>
            <div className="flex flex-col md:flex-row gap-12 p-10 bg-white">
                <div className="w-full md:w-[40%] aspect-square bg-slate-50 rounded-[3rem] border-4 border-slate-100 overflow-hidden flex items-center justify-center text-slate-300 relative shadow-inner group">
                    {product.image ? (
                        <img src={product.image} alt={product.description} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                        <span className="text-8xl opacity-10 font-black tracking-tighter">NULL_IMG</span>
                    )}
                    <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Master Asset</span>
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-10">
                    <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="text-9xl font-black tracking-tighter italic">VPOS</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-4">{product.description}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Asset Index: <span className="text-primary">{product.id}</span></p>

                        <div className="mt-10 pt-10 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Unit Valuation</span>
                            <span className="text-5xl font-black text-primary tracking-tighter tabular-nums drop-shadow-sm">{formatCurrency(product.price)}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-slate-100 flex-1" />
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Extracted Metadata</h4>
                            <div className="h-px bg-slate-100 flex-1" />
                        </div>
                        {product.attributes && Object.keys(product.attributes).length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(product.attributes).map(([key, value]) => (
                                    <div key={key} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-1 hover:bg-white transition-all shadow-sm">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key}</span>
                                        <span className="text-sm font-bold text-slate-700">{value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No supplementary telemetry discovered</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
