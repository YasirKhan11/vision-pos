import React from 'react';
import { Modal } from '../common/Modal';

export const ConfirmationModal = ({ isOpen, onClose, docNumber }: { isOpen: boolean, onClose: () => void, docNumber: string }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Operational Alert">
        <div className="flex flex-col items-center text-center p-12 bg-white rounded-[2.5rem] animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center text-5xl shadow-2xl shadow-green-200 mb-8 animate-bounce">
                ✓
            </div>
            <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-3">Transaction Finalized</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12">
                Document Trace Index: <span className="text-primary">{docNumber}</span>
            </p>
            <button
                className="w-full py-6 bg-primary text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1 active:scale-95 border-b-4 border-primary-dark"
                onClick={onClose}
                autoFocus
            >
                ACKNOWLEDGE & CONTINUE
            </button>
            <p className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-widest italic animate-pulse">Press [ENTER] to execute acknowledgment</p>
        </div>
    </Modal>
);
