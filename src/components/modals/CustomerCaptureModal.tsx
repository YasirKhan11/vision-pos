import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface CustomerCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (c: any) => void;
}

export const CustomerCaptureModal = ({ isOpen, onClose, onSave }: CustomerCaptureModalProps) => {
    const initialFormState = {
        name: '',
        address: '',
        email: '',
        phone: '',
        contactPerson: '',
        vatNumber: '',
        creditLimit: 0,
    };
    const [customerData, setCustomerData] = useState(initialFormState);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setCustomerData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSave = () => {
        const newErrors: { [key: string]: string } = {};
        if (!customerData.name) newErrors.name = 'Customer name is required';
        if (!customerData.phone) newErrors.phone = 'Telephone number is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave(customerData);
        setCustomerData(initialFormState);
        setErrors({});
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Capture New Debtor" bodyClassName="overflow-y-auto" footerContent={
            <div className="flex justify-end gap-6 p-2">
                <button className="px-8 py-4 bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95" onClick={onClose}>Cancel</button>
                <button className="px-10 py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all" onClick={handleSave}>Create Debtor</button>
            </div>
        }>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-slate-50/50 rounded-[2.5rem] border border-slate-100" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="flex flex-col gap-3 md:col-span-2">
                    <label className="text-[10px] font-black text-[#17316c] uppercase tracking-widest ml-4" htmlFor="name">Customer Name*</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        className={`h-16 w-full bg-white border-2 rounded-3xl px-8 text-lg font-black text-slate-800 placeholder:text-slate-200 focus:shadow-xl focus:shadow-primary/5 transition-all outline-none ${errors.name ? 'border-red-500 focus:border-red-500 ring-4 ring-red-500/10' : 'border-slate-100 focus:border-primary/40'}`}
                        value={customerData.name}
                        onChange={handleChange}
                        placeholder="Enter full name..."
                        autoFocus
                        required
                    />
                    {errors.name && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-4 mt-1">{errors.name}</span>}
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-[#17316c] uppercase tracking-widest ml-4" htmlFor="phone">Telephone*</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className={`h-14 bg-white border-2 rounded-2xl px-6 text-sm font-bold text-slate-700 transition-all outline-none ${errors.phone ? 'border-red-500 focus:border-red-500 ring-4 ring-red-500/10' : 'border-slate-100 focus:border-primary/30'}`}
                        value={customerData.phone}
                        onChange={handleChange}
                        placeholder="+27..."
                        required
                    />
                    {errors.phone && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-4 mt-1">{errors.phone}</span>}
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-[#17316c] uppercase tracking-widest ml-4" htmlFor="contactPerson">Contact Person</label>
                    <input type="text" id="contactPerson" name="contactPerson" className="h-14 bg-white border-2 border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-700 focus:border-primary/30 transition-all outline-none" value={customerData.contactPerson} onChange={handleChange} placeholder="Contact person..." />
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-[#17316c] uppercase tracking-widest ml-4" htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" className="h-14 bg-white border-2 border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-700 focus:border-primary/30 transition-all outline-none" value={customerData.email} onChange={handleChange} placeholder="email@domain.com" />
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-[#17316c] uppercase tracking-widest ml-4" htmlFor="vatNumber">VAT Number</label>
                    <input type="text" id="vatNumber" name="vatNumber" className="h-14 bg-white border-2 border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-700 focus:border-primary/30 transition-all outline-none" value={customerData.vatNumber} onChange={handleChange} placeholder="VAT No..." />
                </div>
                <div className="flex flex-col gap-3 md:col-span-2">
                    <label className="text-[10px] font-black text-[#17316c] uppercase tracking-widest ml-4" htmlFor="address">Physical Address</label>
                    <textarea id="address" name="address" className="bg-white border-2 border-slate-100 rounded-3xl p-6 text-sm font-bold text-slate-700 focus:border-primary/30 transition-all outline-none min-h-[120px]" value={customerData.address} onChange={handleChange} placeholder="Physical address..." rows={3}></textarea>
                </div>
                <div className="flex flex-col gap-3 md:col-span-2 group">
                    <label className="text-[10px] font-black text-[#17316c] uppercase tracking-widest ml-4" htmlFor="creditLimit">Credit Limit</label>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">R</span>
                        <input type="number" id="creditLimit" name="creditLimit" className="h-16 w-full bg-white border-2 border-slate-100 rounded-3xl pl-12 pr-8 text-xl font-black text-slate-800 focus:border-primary/40 focus:shadow-xl focus:shadow-primary/5 transition-all outline-none" value={customerData.creditLimit} onChange={handleChange} />
                    </div>
                </div>
            </form>
        </Modal>
    );
};
