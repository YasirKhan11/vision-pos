import React from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footerContent?: React.ReactNode;
    size?: 'medium' | 'large' | 'xlarge';
    bodyClassName?: string;
    disableEscapeKey?: boolean;
}

export const Modal = ({ isOpen, onClose, title, children, footerContent = null, size = 'large', bodyClassName = '', disableEscapeKey = false }: ModalProps) => {
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !disableEscapeKey) {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown, true);
        }

        return () => window.removeEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose, disableEscapeKey]);

    if (!isOpen) return null;

    const sizeClasses = {
        medium: 'max-w-md w-full max-h-[90vh]',
        large: 'max-w-4xl w-full max-h-[90vh]',
        xlarge: 'max-w-[90vw] w-full h-[90vh]'
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in">
            <div
                className={`bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300 ${sizeClasses[size]}`}
            >
                <div className="bg-primary text-white px-6 py-5 flex justify-between items-center shrink-0">
                    <h3 className="text-sm font-black uppercase tracking-widest">{title}</h3>
                    <button
                        className="text-white/40 hover:text-white text-3xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        &times;
                    </button>
                </div>
                <div className={`flex-1 p-6 min-h-0 ${bodyClassName}`}>{children}</div>
                {footerContent && (
                    <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 shrink-0 flex justify-end gap-3 rounded-b-3xl">
                        {footerContent}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
