import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/formatters';
import { SaleState, Payment } from '../../types/domain.types';
import { useHotkeys } from '../../hooks/useHotkeys';

export const TenderModal = ({ isOpen, onClose, onTender, sale, isSaving = false }: {
    isOpen: boolean;
    onClose: () => void;
    onTender: (payments?: Payment[]) => void;
    sale: SaleState | null;
    isSaving?: boolean;
}) => {
    const [tenderAmounts, setTenderAmounts] = useState({
        cash: '',
        cheques: '',
        creditCard: '',
        eft: '',
        rcs: '',
        manual: '',
        other: '',
    });
    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const proceedBtnRef = useRef<HTMLButtonElement>(null);

    const isReturn = sale?.type === 'return' || sale?.type === 'account-return';

    const subTotal = sale?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
    const totalDue = subTotal;

    const totalTendered = Object.values(tenderAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const changeDue = Math.max(0, totalTendered - totalDue);

    const canProceed = Math.round(totalTendered * 100) >= Math.round(totalDue * 100) && !isSaving;

    const paymentMethods: { label: string, key: keyof typeof tenderAmounts, method: Payment['method'] }[] = [
        { label: 'CASH', key: 'cash', method: 'Cash' },
        { label: 'CHEQUES', key: 'cheques', method: 'Cheque' },
        { label: 'CREDIT CARDS', key: 'creditCard', method: 'Credit Card' },
        { label: 'TRANSFERS', key: 'eft', method: 'EFT' },
        { label: 'RCS CARS', key: 'rcs', method: 'RCS' },
        { label: 'MANUAL C/CARD', key: 'manual', method: 'Credit Card' },
        { label: '', key: 'other', method: 'Cash' },
    ];

    useEffect(() => {
        if (isOpen) {
            const remaining = totalDue > 0 ? totalDue.toFixed(2) : '0.00';
            setTenderAmounts({ cash: remaining, cheques: '', creditCard: '', eft: '', rcs: '', manual: '', other: '' });
            setTimeout(() => {
                inputRefs.current.cash?.focus();
                inputRefs.current.cash?.select();
            }, 100);
        } else {
            setTenderAmounts({ cash: '', cheques: '', creditCard: '', eft: '', rcs: '', manual: '', other: '' });
        }
    }, [isOpen, totalDue]);

    const handleAmountChange = (method: keyof typeof tenderAmounts, value: string) => {
        if (/^\d*\.?\d{0,2}$/.test(value)) {
            setTenderAmounts(prev => ({ ...prev, [method]: value }));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, currentKey: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const currentIndex = paymentMethods.findIndex(p => p.key === currentKey);
            const nextMethod = paymentMethods[currentIndex + 1];
            if (nextMethod && inputRefs.current[nextMethod.key]) {
                inputRefs.current[nextMethod.key]?.focus();
                inputRefs.current[nextMethod.key]?.select();
            } else {
                proceedBtnRef.current?.focus();
            }
        }
    };

    const handleProceedWithPayments = () => {
        if (!canProceed) return;
        const payments: Payment[] = [];
        paymentMethods.forEach(pm => {
            const amount = parseFloat(tenderAmounts[pm.key]) || 0;
            if (amount > 0) {
                payments.push({ method: pm.method, amount });
            }
        });
        onTender(payments);
    };

    useHotkeys({ 'F12': handleProceedWithPayments }, [canProceed, onTender, tenderAmounts]);

    const tenderTitle = isReturn ? 'CASH RETURN' : 'CASH SALES';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="TRANSACTION TENDER" size="large"
            bodyClassName="p-0 flex flex-col h-[480px] overflow-hidden"
            footerContent={
                <div className="flex items-center justify-between w-full p-1 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-black uppercase tracking-[0.2em]">PRESS ESC TO CANCEL • F12 TO FINALISE</div>
                    <div className="flex gap-4">
                        <button
                            className="px-6 py-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 font-black rounded-md flex items-center gap-3 active:scale-95 transition-all text-sm uppercase ring-1 ring-slate-100"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            <span className="text-[10px] opacity-40">ESC</span> ABORT
                        </button>
                        <button
                            ref={proceedBtnRef}
                            className={`
                                px-8 py-2 rounded-md font-black text-sm flex items-center gap-3 active:scale-95 transition-all shadow-md
                                ${canProceed ? 'bg-[#22c55e] hover:bg-[#16a34a] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                            `}
                            onClick={handleProceedWithPayments}
                            disabled={!canProceed}
                        >
                            {isSaving ? 'SAVING...' : 'FINALISE SALE'}
                            <span className="text-[10px] opacity-60 ml-1">F12</span>
                        </button>
                    </div>
                </div>
            }>
            <div className="flex flex-row h-full">
                {/* Left Banner */}
                <div className="w-[160px] relative shrink-0 overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1974&auto=format&fit=crop"
                        alt="Checkout"
                        className="absolute inset-0 w-full h-full object-cover brightness-[0.4]"
                    />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <h2 className="text-xl font-black text-white leading-none uppercase mb-2">Checkout</h2>
                        <p className="text-[9px] font-black text-white/70 uppercase leading-tight tracking-wider">
                            Select payment methods.
                        </p>
                    </div>
                </div>

                {/* Middle Panel - Payment Methods */}
                <div className="flex-[2.5] bg-slate-200/60 p-5 pt-4 border-r border-slate-300 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-slate-500 text-xs">📋</span>
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Payment Methods</h4>
                    </div>
                    <div className="space-y-1.5">
                        {paymentMethods.map(pm => (
                            <div className="flex flex-col gap-1" key={pm.key}>
                                <div className="flex items-center bg-white/60 border border-slate-300 rounded overflow-hidden group focus-within:ring-2 focus-within:ring-[#17316c]/20 focus-within:border-[#17316c] transition-all">
                                    <label
                                        htmlFor={`${pm.key}Amount`}
                                        className="w-36 px-3 py-2.5 text-xs font-bold text-[#17316c] uppercase tracking-wider bg-slate-50 border-r border-slate-200"
                                    >
                                        {pm.label}
                                    </label>
                                    <input
                                        ref={(el) => { inputRefs.current[pm.key] = el; }}
                                        id={`${pm.key}Amount`}
                                        type="text"
                                        inputMode="decimal"
                                        className="flex-1 px-3 py-2.5 bg-white text-xl font-black text-black outline-none placeholder:text-slate-300 placeholder:text-lg"
                                        value={tenderAmounts[pm.key]}
                                        onChange={e => handleAmountChange(pm.key, e.target.value)}
                                        onKeyDown={e => handleKeyDown(e, pm.key)}
                                        onFocus={e => e.target.select()}
                                        disabled={isSaving}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel - Summary */}
                <div className="flex-1 bg-white p-6 flex flex-col gap-6 overflow-y-auto border-l border-slate-100">
                    <div className="border-b border-slate-200 pb-1.5">
                        <h3 className="text-2xl font-black text-[#17316c] tracking-tight uppercase">{tenderTitle}</h3>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest">Total Amount Due</label>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalDue)}</div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest">Total Tendered</label>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalTendered)}</div>
                    </div>

                    <div className="mt-auto space-y-1 pt-4 border-t border-slate-50">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest">Change to Customer</label>
                        <div className={`text-5xl font-black tracking-tighter`} style={{ color: changeDue > 0 ? '#17316c' : '#CBD5E1' }}>
                            {formatCurrency(changeDue)}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
