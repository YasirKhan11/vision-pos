import React, { useState, useEffect } from 'react';
import { Product } from '../../types/domain.types';
import { MOCK_PARTS, MOCK_MODELS, MOCK_VARIANTS, MOCK_DEPARTMENTS, MOCK_SUB_DEPARTMENTS, MOCK_MANUFACTURERS } from '../../data/mockData';
import { Modal } from '../common/Modal';
import { SearchableSelect } from '../common/SearchableSelect';
import { PartDetailModal } from './PartDetailModal';
import { formatCurrency } from '../../utils/formatters';

export const PartsFinderModal = ({ isOpen, onClose, onSelectProduct }: { isOpen: boolean, onClose: () => void, onSelectProduct: (p: Product) => void }) => {
    const [selections, setSelections] = useState<{ [key: string]: string | null }>({ manufacturer: null, model: null, variant: null, department: null, subDepartment: null });
    const [results, setResults] = useState<(Product & { variantIds: string[]; subDepartmentId: string; })[]>([]);
    const [detailPart, setDetailPart] = useState<Product | null>(null);

    const handleSelect = (level: string, value: any) => {
        const newSelections = { ...selections };
        const levels = ['manufacturer', 'model', 'variant', 'department', 'subDepartment'];
        const currentLevelIndex = levels.indexOf(level);

        newSelections[level] = value;
        // Reset subsequent levels
        for (let i = currentLevelIndex + 1; i < levels.length; i++) {
            newSelections[levels[i]] = null;
        }
        setSelections(newSelections);
        setResults([]);
    };

    useEffect(() => {
        if (selections.variant && selections.subDepartment) {
            const filteredParts = MOCK_PARTS.filter(p => selections.variant && p.variantIds.includes(selections.variant) && p.subDepartmentId === selections.subDepartment);
            setResults(filteredParts);
        }
    }, [selections]);

    const handleClearAll = () => {
        setSelections({ manufacturer: null, model: null, variant: null, department: null, subDepartment: null });
        setResults([]);
    };

    const handleAddToCart = (part: Product) => {
        onSelectProduct(part);
        if (detailPart) setDetailPart(null); // close detail view if open
        onClose(); // close finder
    };

    const models = selections.manufacturer ? MOCK_MODELS.filter(m => m.manufacturerId === selections.manufacturer) : [];
    const variants = selections.model ? MOCK_VARIANTS.filter(v => v.modelId === selections.model) : [];
    const subDepartments = selections.department ? MOCK_SUB_DEPARTMENTS.filter(sd => sd.departmentId === selections.department) : [];

    const selectionData = [
        { name: 'Manufacturer', value: MOCK_MANUFACTURERS.find(m => m.id === selections.manufacturer)?.name },
        { name: 'Model', value: MOCK_MODELS.find(m => m.id === selections.model)?.name },
        { name: 'Variant', value: MOCK_VARIANTS.find(v => v.id === selections.variant)?.name },
        { name: 'Department', value: MOCK_DEPARTMENTS.find(d => d.id === selections.department)?.name },
        { name: 'Sub-Department', value: MOCK_SUB_DEPARTMENTS.find(sd => sd.id === selections.subDepartment)?.name },
    ].filter(s => s.value);

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Advanced Component Locator" size="xlarge">
                <div className="flex flex-col h-[80vh] bg-slate-50 overflow-hidden font-sans">
                    <div className="p-8 bg-white border-b border-slate-100 flex flex-col gap-6 shrink-0 relative z-20 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <SearchableSelect label="OEM / Manufacturer" options={MOCK_MANUFACTURERS} value={selections.manufacturer} onChange={val => handleSelect('manufacturer', val)} placeholder="Select OEM..." />
                            <SearchableSelect label="Model Series" options={models} value={selections.model} onChange={val => handleSelect('model', val)} placeholder="Select Model..." disabled={!selections.manufacturer} />
                            <SearchableSelect label="Variant Spec" options={variants} value={selections.variant} onChange={val => handleSelect('variant', val)} placeholder="Select Variant..." disabled={!selections.model} />
                            <SearchableSelect label="Sector / Department" options={MOCK_DEPARTMENTS} value={selections.department} onChange={val => handleSelect('department', val)} placeholder="Select Dept..." disabled={!selections.variant} />
                            <SearchableSelect label="Sub-Sector" options={subDepartments} value={selections.subDepartment} onChange={val => handleSelect('subDepartment', val)} placeholder="Select Sub-Dept..." disabled={!selections.department} />
                        </div>

                        {(selectionData.length > 0) && (
                            <div className="flex items-center justify-between bg-primary/5 p-4 rounded-3xl border border-primary/10">
                                <div className="flex flex-wrap gap-2">
                                    {selectionData.map(s => (
                                        <span key={s.name} className="px-4 py-2 bg-white text-primary text-[10px] font-black rounded-xl border border-primary/20 shadow-sm uppercase tracking-widest">
                                            {s.value}
                                        </span>
                                    ))}
                                </div>
                                <button onClick={handleClearAll} className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] hover:text-red-600 transition-colors ml-4">
                                    [ RESET SYSTEM ]
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-slate-100/30">
                        {results.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {results.map(part => (
                                    <div key={part.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-black/[0.02] hover:shadow-black/10 transition-all hover:-translate-y-2 flex flex-col h-full">
                                        <div className="aspect-square bg-slate-50 overflow-hidden relative cursor-pointer" onClick={() => setDetailPart(part)}>
                                            <img src={part.image} alt={part.description} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-white">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{part.id}</span>
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                                            <div className="cursor-pointer" onClick={() => setDetailPart(part)}>
                                                <h5 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors line-clamp-2">{part.description}</h5>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Component Unit</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
                                                <span className="text-lg font-black text-primary tabular-nums">{formatCurrency(part.price)}</span>
                                                <button
                                                    className="px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                                                    onClick={() => handleAddToCart(part)}
                                                >
                                                    Acquire
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            selections.subDepartment ? (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-300">
                                    <span className="text-8xl opacity-10 mb-6">⚙️</span>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero compatible components identified</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-200">
                                    <span className="text-8xl opacity-10 mb-6">🔍</span>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Configuring filters... Awaiting OEM selection</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </Modal>
            <PartDetailModal isOpen={!!detailPart} onClose={() => setDetailPart(null)} part={detailPart} onAddToCart={handleAddToCart} />
        </>
    );
};
