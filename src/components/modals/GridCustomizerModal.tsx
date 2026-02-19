import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from '../common/Modal';

export interface GridColumnConfig {
    key: string;
    caption: string;
    visible: boolean;
    width?: number;
    minWidth?: number;
    alignment?: 'left' | 'right' | 'center';
    dataType?: 'string' | 'number' | 'date' | 'currency';
}

interface GridCustomizerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (columns: GridColumnConfig[]) => void;
    initialColumns: GridColumnConfig[];
}

export const GridCustomizerModal = ({ isOpen, onClose, onSave, initialColumns }: GridCustomizerModalProps) => {
    const [columns, setColumns] = useState<GridColumnConfig[]>(initialColumns);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setColumns(initialColumns);
            setSelectedIndex(0);
        }
    }, [isOpen, initialColumns]);

    // Focus container when opened
    useEffect(() => {
        if (isOpen) {
            // Small timeout to allow render
            setTimeout(() => {
                const container = document.getElementById('grid-customizer-container');
                if (container) container.focus();
            }, 50);
        }
    }, [isOpen]);

    // Auto-scroll to selected index
    useEffect(() => {
        if (isOpen && itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [selectedIndex, isOpen]);

    const handleToggle = (index: number) => {
        setColumns(prev => {
            const newCols = [...prev];
            newCols[index] = { ...newCols[index], visible: !newCols[index].visible };
            return newCols;
        });
    };

    const moveItem = useCallback((currentIndex: number, direction: 'up' | 'down') => {
        setColumns(prev => {
            if ((direction === 'up' && currentIndex === 0) ||
                (direction === 'down' && currentIndex === prev.length - 1)) {
                return prev;
            }

            const newCols = [...prev];
            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

            // Swap
            [newCols[currentIndex], newCols[targetIndex]] = [newCols[targetIndex], newCols[currentIndex]];

            return newCols;
        });

        setSelectedIndex(prev => direction === 'up' ? prev - 1 : prev + 1);
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        // F10 - Save
        if (e.key === 'F10') {
            e.preventDefault();
            e.stopPropagation();
            const visibleCount = columns.filter(c => c.visible).length;
            if (visibleCount === 0) {
                alert("Please select at least one column.");
                return;
            }
            onSave(columns);
            onClose();
            return;
        }

        // F2 - Select All
        if (e.key === 'F2') {
            e.preventDefault();
            e.stopPropagation();
            setColumns(prev => prev.map(c => ({ ...c, visible: true })));
            return;
        }

        // F3 - Deselect All (Needs stopImmediatePropagation to kill browser Find)
        if (e.key === 'F3') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            setColumns(prev => prev.map(c => ({ ...c, visible: false })));
            return;
        }

        // Arrow keys - Navigation
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(0, prev - 1));
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(columns.length - 1, prev + 1));
            return;
        }

        // Plus / Minus - Move Item
        if (e.key === '+' || e.key === '=') { // = is often unshifted +
            e.preventDefault();
            moveItem(selectedIndex, 'up');
            return;
        }
        if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            moveItem(selectedIndex, 'down');
            return;
        }

        // Space / Enter - Toggle Visibility
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleToggle(selectedIndex);
            return;
        }

        // Escape - Close this modal only (stop propagation to parent)
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onClose();
            return;
        }
    }, [isOpen, columns, selectedIndex, moveItem, onSave, onClose]);

    // Use capture phase to intercept F3 before browser Find
    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener('keydown', handleKeyDown, true); // true = capture phase
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [handleKeyDown, isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customise Grid Columns" size="medium">
            <div
                id="grid-customizer-container"
                className="flex flex-col h-[60vh] outline-none"
                tabIndex={0}
                autoFocus
            >
                <div className="bg-slate-50 p-4 border-b border-slate-200">
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <div><span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">↑</span> <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">↓</span> Navigate</div>
                        <div className="text-right"><span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">Space</span> Toggle</div>
                        <div><span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">+</span> Move Up</div>
                        <div className="text-right"><span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">-</span> Move Down</div>
                        <div><span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">F2</span> Select All</div>
                        <div className="text-right"><span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">F3</span> Deselect All</div>
                        <div><span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-primary border-primary/20 text-primary">F10</span> Save</div>
                        <div className="text-right"><span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-red-500 border-red-200">Esc</span> Cancel</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {columns.map((col, idx) => (
                        <div
                            key={col.key}
                            ref={el => itemRefs.current[idx] = el}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${idx === selectedIndex
                                ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-sm'
                                : 'bg-white border-slate-100 hover:bg-slate-50'
                                }`}
                            onClick={() => {
                                setSelectedIndex(idx);
                                handleToggle(idx);
                            }}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${col.visible
                                ? 'bg-primary border-primary text-white'
                                : 'bg-white border-slate-300 text-transparent'
                                }`}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className={`font-bold text-sm ${col.visible ? 'text-slate-800' : 'text-slate-400'}`}>
                                {col.caption}
                            </span>
                            {idx === selectedIndex && (
                                <div className="ml-auto text-[10px] uppercase font-black tracking-widest text-primary/40">
                                    Selected
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-colors"
                    >
                        Cancel (Esc)
                    </button>
                    <button
                        onClick={() => onSave(columns)}
                        className="px-6 py-2 text-sm font-black text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                        Save Settings (F10)
                    </button>
                </div>
            </div>
        </Modal>
    );
};
