import React from 'react';
import { Modal } from '../common/Modal';

interface GenericConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const GenericConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Yes, Proceed',
    cancelText = 'No, Cancel',
    type = 'info'
}: GenericConfirmationModalProps) => {
    const typeClasses = {
        danger: 'bg-red-500 shadow-red-200',
        warning: 'bg-amber-500 shadow-amber-200',
        info: 'bg-primary shadow-primary/20'
    };

    const footer = (
        <div className="flex gap-4 w-full">
            <button
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                onClick={onClose}
            >
                {cancelText}
            </button>
            <button
                className={`flex-1 py-4 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 ${typeClasses[type]}`}
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
                autoFocus
            >
                {confirmText}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footerContent={footer}
            size="medium"
        >
            <div className="flex flex-col items-center text-center py-6 px-2">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl text-white mb-6 shadow-2xl ${typeClasses[type]}`}>
                    {type === 'danger' ? '!' : type === 'warning' ? '?' : 'i'}
                </div>
                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4">{title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                    {message}
                </p>
                <div className="mt-8 p-4 bg-slate-50 rounded-2xl w-full">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                        Press [ENTER] to confirm or [ESC] to cancel
                    </p>
                </div>
            </div>
        </Modal>
    );
};
