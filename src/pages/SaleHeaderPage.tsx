import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import { Customer, SaleState } from '../types/domain.types';

import { CustomerSearchModal, SearchMode } from '../components/modals/CustomerSearchModal';
import { CustomerCaptureModal } from '../components/modals/CustomerCaptureModal';
import { GenericConfirmationModal } from '../components/modals/GenericConfirmationModal';
import { transformApiCustomer } from '../utils/transformers';
import { useHotkeys } from '../hooks/useHotkeys';
import { CASH_CUSTOMER, VAT_INDICATOR_OPTIONS, SALESREP_OPTIONS, WAREHOUSE_OPTIONS, USE_MOCK_DATA } from '../data/mockData';
import { InvoiceLookupModal } from '../components/modals/InvoiceLookupModal';
import notify from 'devextreme/ui/notify';


export const SaleHeaderPage = ({ sale, setSale, onProceed, onBack }: { sale: SaleState, setSale: (s: SaleState) => void, onProceed: () => void, onBack: () => void }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [customerAccountInput, setCustomerAccountInput] = useState(sale.customer?.id || '');
    const [customerNameInput, setCustomerNameInput] = useState(sale.customer?.name || '');
    const [modals, setModals] = useState({ customerSearch: false, customerCapture: false, abortConfirm: false, invoiceLookup: false });
    const customerInputRef = useRef<HTMLInputElement>(null);
    const invoiceInputRef = useRef<HTMLInputElement>(null);


    // Focus account input on mount or when search modal closes
    useEffect(() => {
        if (!modals.customerSearch && !modals.customerCapture && !sale.customer) {
            customerInputRef.current?.focus();
        }
    }, [modals.customerSearch, modals.customerCapture, sale.customer]);

    // Sync input fields when customer changes
    useEffect(() => {
        setCustomerAccountInput(sale.customer?.id || '');
        setCustomerNameInput(sale.customer?.name || '');
        setInvoiceNoInput(sale.headerDetails.originalInvoiceNo || '');
    }, [sale.customer, sale.headerDetails.originalInvoiceNo]);

    const [invoiceNoInput, setInvoiceNoInput] = useState(sale.headerDetails.originalInvoiceNo || '');


    // Load customers from API on mount
    useEffect(() => {
        const loadCustomers = async () => {
            if (USE_MOCK_DATA) return;

            setCustomersLoading(true);
            try {
                const data = await api.customers.getAll({
                    pageno: 1,
                    recordsperpage: 500
                });
                const transformed = data.map(transformApiCustomer);
                // Deduplicate by ID to avoid E1040 error
                const uniqueCustomers = Array.from(new Map(transformed.map(c => [c.id, c])).values());
                setCustomers(uniqueCustomers);
            } catch (error) {
                console.error('Failed to load customers:', error);
            } finally {
                setCustomersLoading(false);
            }
        };
        loadCustomers();
    }, []);

    const getHeaderTitle = (type: SaleState['type']): string => {
        switch (type) {
            case 'sale': return 'CASH SALE';
            case 'account': return 'ACCOUNT SALE';
            case 'return': return 'CASH RETURN';
            case 'account-return': return 'ACCOUNT RETURN';
            case 'order': return 'SALES ORDER';
            case 'quotation': return 'QUOTATION';
            default: return 'Capture Account Details';
        }
    };

    const title = getHeaderTitle(sale.type);

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSale({ ...sale, headerDetails: { ...sale.headerDetails, [name]: value } });
    };

    const handleSelectCustomer = (selectedCustomer: Customer) => {
        setSale({
            ...sale,
            customer: selectedCustomer,
            headerDetails: {
                ...sale.headerDetails,
                vatIndicator: selectedCustomer.vatIndicator || 'I'
            }
        });
        setCustomerAccountInput(selectedCustomer.id);
        setModals({ customerSearch: false, customerCapture: false, abortConfirm: false, invoiceLookup: false });
    };

    const handleCreateCustomer = async (newCustomerData: Omit<Customer, 'id'>) => {
        // Try to create customer via API
        if (!USE_MOCK_DATA) {
            try {
                const apiCustomer = await api.customers.create({
                    DEBCODE: `CUST${Date.now().toString().slice(-6)}`,
                    DEBNAME: newCustomerData.name,
                    DEBADDR1: newCustomerData.address1,
                    DEBADDR2: newCustomerData.address2,
                    DEBADDR4: newCustomerData.city,
                    DEBPOSTCODE: newCustomerData.state,
                    DEBEMAIL: newCustomerData.email,
                    DEBPHONE: newCustomerData.phone,
                    DEBCREDITLIMIT: newCustomerData.creditLimit,
                    DEBCONTACT: newCustomerData.contactPerson,
                    DEBVATNO: newCustomerData.vatNumber,
                });
                const newCustomer = transformApiCustomer(apiCustomer);
                setCustomers(prev => [...prev, newCustomer]);
                handleSelectCustomer(newCustomer);
                return;
            } catch (error) {
                console.error('Failed to create customer via API:', error);
            }
        }

        // Fallback to local creation
        const newCustomer: Customer = {
            ...(newCustomerData as any),
            id: `CUST${Date.now().toString().slice(-6)}`,
            address: newCustomerData.address || [newCustomerData.address1, newCustomerData.address2, newCustomerData.city, newCustomerData.state].filter(Boolean).join(' ')
        };
        setCustomers(prev => [...prev, newCustomer]);
        handleSelectCustomer(newCustomer);
    };

    const handleCustomerInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === '?') {
            e.preventDefault();
            if (customerAccountInput.trim() === '') {
                setModals(m => ({ ...m, customerSearch: true }));
            } else {
                // Search locally first
                let found = customers.find(c => c.id.toLowerCase() === customerAccountInput.toLowerCase());

                // If not found locally and API is enabled, try API
                if (!found && !USE_MOCK_DATA) {
                    try {
                        const apiCustomer = await api.customers.getByCode(customerAccountInput);
                        if (apiCustomer) {
                            found = transformApiCustomer(apiCustomer);
                        }
                    } catch (error) {
                        console.error('API customer lookup failed:', error);
                    }
                }

                if (found) {
                    handleSelectCustomer(found);
                } else {
                    setModals(m => ({ ...m, customerSearch: true }));
                }
            }
        }
    };

    const handleCustomerSearch = async (searchTerm: string, mode: SearchMode) => {
        if (USE_MOCK_DATA) return;

        setCustomersLoading(true);
        try {
            const params: any = {
                pageno: 1,
                recordsperpage: searchTerm ? 100 : 500
            };

            if (searchTerm) {
                if (mode === 'account') {
                    params.Account = `like ${searchTerm}`;
                } else {
                    const paramMap: Record<SearchMode, string> = {
                        account: 'debaccount',
                        name: 'debname',
                        tradename: 'debtradename',
                        telephone: 'debtelephone',
                        telephone2: 'debtelephone2',
                        idno: 'debidno',
                        quoteno: 'debquoteno',
                        vehiclereg: 'debvehiclereg',
                        vehiclechasis: 'debvehiclechasis',
                        email: 'debemail',
                        appcode: 'debappcode',
                    };
                    params[paramMap[mode]] = `%${searchTerm}%`;
                }
            }

            const data = await api.customers.getAll(params);
            const transformed = data.map(transformApiCustomer);
            const uniqueCustomers = Array.from(new Map(transformed.map(c => [c.id, c])).values());
            setCustomers(uniqueCustomers);
        } catch (error) {
            console.error('Customer search failed:', error);
        } finally {
            setCustomersLoading(false);
        }
    };

    const handleAbortTrigger = () => {
        setModals(m => ({ ...m, abortConfirm: true }));
    };

    const isReturn = sale.type === 'return' || sale.type === 'account-return';

    const handleProceed = () => {
        if (isReturn && !sale.headerDetails.originalInvoiceNo) {
            notify({
                message: "ORIGINAL INVOICE REQUIRED: Please provide a valid invoice number for return transactions.",
                type: "error",
                displayTime: 4000,
                position: { at: "top center", my: "top center", offset: "0 50" }
            });
            invoiceInputRef.current?.focus();
            return;
        }
        onProceed();
    };

    const handleUnallocatedTransaction = async () => {
        if (!sale.customer) {
            notify({
                message: "CUSTOMER REQUIRED: Please select a customer first.",
                type: "warning",
                displayTime: 3000,
            });
            customerInputRef.current?.focus();
            return;
        }

        try {
            const sysNumber = await api.sales.invoices.getUnallocatedNumber();
            if (sysNumber) {
                const docNo = sysNumber.toString();
                setInvoiceNoInput(docNo);
                setSale({
                    ...sale,
                    isUnallocated: true,
                    headerDetails: { ...sale.headerDetails, originalInvoiceNo: docNo }
                });
                notify({
                    message: "UNALLOCATED RETURN: System number generated. Press F10 to proceed.",
                    type: "info",
                    displayTime: 3000
                });
            }
        } catch (error) {
            console.error('Failed to get unallocated number:', error);
            notify({
                message: "Failed to generate unallocated number.",
                type: "error"
            });
        }
    };

    useHotkeys({
        'Escape': handleAbortTrigger,
        'F10': handleProceed,
        'F3': () => setModals(m => ({ ...m, customerSearch: true })),
        'F6': () => setModals(m => ({ ...m, customerCapture: true })),
        'F5': handleUnallocatedTransaction,
    }, [sale, handleAbortTrigger, onProceed, isReturn, handleProceed, handleUnallocatedTransaction]);
    const isAccountTransaction = sale.type === 'account' || sale.type === 'account-return' || sale.type === 'order' || sale.type === 'quotation';
    const isCustomerLocked = sale.type === 'order' || sale.type === 'quotation';

    const getPageTitle = () => {
        switch (sale.type) {
            case 'order': return 'Capture Sales Order';
            case 'quotation': return 'Capture Quotation';
            case 'return': return 'Return/Credit Note';
            case 'account-return': return 'Account Credit Note';
            default: return 'Account Sale Details';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f0f4f8] overflow-hidden font-sans select-none">
            <CustomerSearchModal
                isOpen={modals.customerSearch}
                onClose={() => setModals(m => ({ ...m, customerSearch: false }))}
                onSelectCustomer={handleSelectCustomer}
                customers={customers}
                loading={customersLoading}
                onSearch={handleCustomerSearch}
            />
            <InvoiceLookupModal
                isOpen={modals.invoiceLookup}
                onClose={() => setModals(m => ({ ...m, invoiceLookup: false }))}
                onSelectInvoice={(invoice) => {
                    setSale({
                        ...sale,
                        headerDetails: { ...sale.headerDetails, originalInvoiceNo: invoice.docno },
                        originalInvoiceItems: invoice.orderdetails || []
                    });
                    setInvoiceNoInput(invoice.docno);
                    setModals(m => ({ ...m, invoiceLookup: false }));
                }}
                account={sale.customer?.id || ''}
                txtp={sale.type === 'return' ? 'POSCSH' : sale.type === 'account-return' ? 'POSASL' : undefined}
            />
            <CustomerCaptureModal isOpen={modals.customerCapture} onClose={() => setModals(m => ({ ...m, customerCapture: false }))} onSave={handleCreateCustomer} />

            <GenericConfirmationModal
                isOpen={modals.abortConfirm}
                onClose={() => setModals(m => ({ ...m, abortConfirm: false }))}
                onConfirm={onBack}
                title="Abort Transaction"
                message="Are you sure you want to abort this process and return to the dashboard? All captured details will be lost."
                confirmText="Yes, Abort"
                cancelText="No, Stay"
                type="warning"
            />

            {/* Main Header */}
            <div className="bg-[#17316c] text-white px-4 py-1.5 shrink-0">
                <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2.5">

                {/* Account Selection Top Bar */}
                <div className="bg-[#e2eaf2] border border-[#cbd5e1] p-2 flex items-center gap-3 rounded-sm shadow-sm">
                    <div className="flex items-center gap-2">
                        <label htmlFor="customerAccount" className="text-[11px] font-bold text-[#17316c] uppercase whitespace-nowrap px-2">Account</label>
                        <input
                            ref={customerInputRef}
                            type="text"
                            id="customerAccount"
                            className="w-32 px-2 py-1 bg-white border border-[#94a3b8] rounded-sm font-bold text-[#1e293b] outline-none focus:border-[#17316c] focus:ring-1 focus:ring-[#17316c]/20"
                            value={customerAccountInput}
                            onChange={(e) => setCustomerAccountInput(e.target.value.slice(0, 20))}
                            onKeyDown={handleCustomerInputKeyDown}
                            placeholder="Code / ?"
                            autoFocus
                            readOnly={isCustomerLocked}
                        />
                    </div>

                    <input
                        type="text"
                        className="flex-1 px-4 py-1 bg-white border border-[#cbd5e1] rounded-sm font-bold text-[#1e293b] text-base outline-none focus:border-[#17316c] focus:ring-1 focus:ring-[#17316c]/20"
                        value={customerNameInput}
                        onChange={(e) => setCustomerNameInput(e.target.value)}
                        placeholder="Customer Name"
                    />

                    <div className="flex gap-1 shrink-0">
                        <button
                            type="button"
                            className="w-10 h-8 flex items-center justify-center bg-white border border-[#cbd5e1] text-[#17316c] hover:bg-slate-50 transition-colors rounded-sm"
                            onClick={() => { setCustomerAccountInput(''); setSale({ ...sale, customer: null }); }}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="w-10 h-8 flex items-center justify-center bg-white border border-[#cbd5e1] text-[#17316c] hover:bg-slate-50 transition-colors rounded-sm"
                            onClick={() => setModals(m => ({ ...m, customerSearch: true }))}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main 2-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-stretch h-full">

                    {/* Left Column */}
                    <div className="flex flex-col gap-2.5 h-full">
                        {/* Address Details */}
                        <div className="bg-white border border-[#cbd5e1] rounded-sm shadow-sm overflow-hidden flex-1">
                            <div className="bg-[#17316c] text-white px-3 py-2 text-lg font-bold uppercase tracking-wider border-l-4 border-l-white/20">
                                | ADDRESS DETAILS
                            </div>
                            <div className="p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm font-bold text-[#17316c]">Address 1</label>
                                    <input type="text" className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[#334155] font-medium outline-none shadow-sm" readOnly value={sale.customer?.address1 || ''} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm font-bold text-[#17316c]">Address 2</label>
                                    <input type="text" className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[#334155] font-medium outline-none shadow-sm" readOnly value={sale.customer?.address2 || ''} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm font-bold text-[#17316c]">City</label>
                                    <input type="text" className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[#334155] font-medium outline-none shadow-sm" readOnly value={sale.customer?.city || ''} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm font-bold text-[#17316c]">Code</label>
                                    <input type="text" className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[#334155] font-medium outline-none shadow-sm" readOnly value={sale.customer?.state || ''} />
                                </div>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="bg-white border border-[#cbd5e1] rounded-sm shadow-sm overflow-hidden flex-1">
                            <div className="bg-[#17316c] text-white px-3 py-2 text-lg font-bold uppercase tracking-wider border-l-4 border-l-white/20">
                                | CONTACT DETAILS
                            </div>
                            <div className="p-3 space-y-2">
                                <div className="flex gap-4">
                                    <div className="flex-1 flex items-center gap-2">
                                        <label className="w-24 text-sm font-bold text-[#17316c]">Contact</label>
                                        <input type="text" className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[#334155] font-medium outline-none shadow-sm" readOnly value={sale.customer?.contactPerson || ''} />
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <label className="w-16 text-sm font-bold text-[#17316c]">Email</label>
                                        <input type="text" className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[#334155] font-medium outline-none shadow-sm" readOnly value={sale.customer?.email || ''} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm font-bold text-[#17316c]">Telephone</label>
                                    <input type="text" className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[#334155] font-medium outline-none shadow-sm" readOnly value={sale.customer?.phone || ''} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm font-bold text-[#17316c]">WhatsApp</label>
                                    <input type="text" className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[#334155] font-medium outline-none shadow-sm" readOnly value={sale.customer?.whatsapp || ''} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm font-bold text-[#17316c]">Cell</label>
                                    <input type="text" className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[#334155] font-medium outline-none shadow-sm" readOnly value={sale.customer?.cellphone || ''} />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Split into 2 sub-columns */}
                    <div className="grid grid-cols-2 gap-2.5 h-full">
                        {/* Right Column A */}
                        <div className="flex flex-col gap-2.5 h-full">
                            {/* Document Details */}
                            <div className="bg-white border border-[#cbd5e1] rounded-sm shadow-sm overflow-hidden flex-1">
                                <div className="bg-[#17316c] text-white px-3 py-2 text-lg font-bold uppercase tracking-wider border-l-4 border-l-white/20">
                                    | DOCUMENT DETAILS
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">Doc Date</label>
                                        <input type="date" name="documentDate" className="flex-1 px-3 py-1 bg-white border border-[#94a3b8] rounded-sm font-bold text-[#1e293b] outline-none shadow-sm" value={sale.headerDetails.documentDate} onChange={handleHeaderChange} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">Due Date</label>
                                        <input type="date" name="dueDate" className="flex-1 px-3 py-1 bg-white border border-[#94a3b8] rounded-sm font-bold text-[#1e293b] outline-none shadow-sm" value={sale.headerDetails.dueDate} onChange={handleHeaderChange} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">Deliv Date</label>
                                        <input type="date" name="deliveryDate" className="flex-1 px-3 py-1 bg-white border border-[#94a3b8] rounded-sm font-bold text-[#1e293b] outline-none shadow-sm" value={sale.headerDetails.deliveryDate} onChange={handleHeaderChange} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">Reference</label>
                                        <input type="text" name="referenceNo" className="flex-1 px-3 py-1.5 bg-white border border-[#94a3b8] rounded-sm font-bold text-[#1e293b] outline-none placeholder-[#94a3b8] shadow-sm" value={sale.headerDetails.referenceNo} onChange={handleHeaderChange} placeholder="Ref No." />
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Details (Merged) */}
                            <div className="bg-white border border-[#cbd5e1] rounded-sm shadow-sm overflow-hidden flex-1">
                                <div className="bg-[#17316c] text-white px-3 py-2 text-lg font-bold uppercase tracking-wider border-l-4 border-l-white/20">
                                    | TRANSACTION DETAILS
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">VAT Ind.</label>
                                        <select name="vatIndicator" className="flex-1 px-3 py-1.5 bg-white border border-[#94a3b8] rounded-sm font-bold text-[#1e293b] outline-none shadow-sm focus:border-[#17316c]" value={sale.headerDetails.vatIndicator} onChange={handleHeaderChange}>
                                            {Object.entries(VAT_INDICATOR_OPTIONS).map(([value, label]: [string, string]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">Warehouse</label>
                                        <select name="warehouse" className="flex-1 px-3 py-1.5 bg-white border border-[#94a3b8] rounded-sm font-bold text-[#1e293b] outline-none shadow-sm focus:border-[#17316c]" value={sale.headerDetails.warehouse} onChange={handleHeaderChange}>
                                            <option value="">Select</option>
                                            {WAREHOUSE_OPTIONS.map((option: string) => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">Sales Rep</label>
                                        <select name="salesRep" className="flex-1 px-3 py-1.5 bg-white border border-[#94a3b8] rounded-sm font-bold text-[#1e293b] outline-none shadow-sm focus:border-[#17316c]" value={sale.headerDetails.salesRep} onChange={handleHeaderChange}>
                                            <option value="">Select</option>
                                            {SALESREP_OPTIONS.map((option: string) => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">Comm Rep</label>
                                        <select name="mainSalesrep" className="flex-1 px-3 py-1.5 bg-white border border-[#94a3b8] rounded-sm font-bold text-[#1e293b] outline-none shadow-sm focus:border-[#17316c]" value={sale.headerDetails.mainSalesrep} onChange={handleHeaderChange}>
                                            <option value="">Select</option>
                                            {SALESREP_OPTIONS.map((option: string) => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column B */}
                        <div className="flex flex-col gap-2.5 h-full">
                            {/* Tax Details Moved Here */}
                            <div className="bg-white border border-[#cbd5e1] rounded-sm shadow-sm overflow-hidden flex-1">
                                <div className="bg-[#17316c] text-white px-3 py-2 text-lg font-bold uppercase tracking-wider border-l-4 border-l-white/20">
                                    | TAX DETAILS
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">VAT No.</label>
                                        <input type="text" className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[#334155] font-medium outline-none shadow-sm" readOnly value={sale.customer?.vatNumber || ''} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">Reg. No.</label>
                                        <input type="text" className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[#334155] font-medium outline-none shadow-sm" readOnly value={sale.customer?.registrationNumber || ''} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">Delivery</label>
                                        <select name="deliveryMethod" className="flex-1 px-3 py-1.5 bg-white border border-[#94a3b8] rounded-sm text-[#1e293b] font-bold outline-none focus:border-[#17316c] shadow-sm" value={sale.headerDetails.deliveryMethod} onChange={handleHeaderChange}>
                                            <option value="">Select</option>
                                            <option value="Collection">Collection</option>
                                            <option value="Delivery">Delivery</option>
                                            <option value="Courier">Courier</option>
                                            <option value="In-Store">In-Store</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="w-20 text-sm font-bold text-[#17316c]">Ship To</label>
                                        <select name="addressSelection" className="flex-1 px-3 py-1.5 bg-white border border-[#94a3b8] rounded-sm text-[#1e293b] font-bold outline-none focus:border-[#17316c] shadow-sm" value={sale.headerDetails.addressSelection} onChange={handleHeaderChange}>
                                            <option value="">Select</option>
                                            <option value="billing">Billing</option>
                                            <option value="delivery">Delivery</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Credit Info */}
                            <div className="bg-white border border-[#cbd5e1] rounded-sm shadow-sm overflow-hidden flex-1 flex flex-col">
                                <div className="bg-[#17316c] text-white px-3 py-2 text-lg font-bold uppercase tracking-wider border-l-4 border-l-white/20">
                                    | {isReturn ? 'RETURN INFO' : 'CREDIT INFO'}
                                </div>
                                <div className="p-3 bg-[#f8fafc] flex-1 flex flex-col gap-2">
                                    {isReturn && (
                                        <div className="flex flex-col gap-1 pb-2 border-b border-[#cbd5e1]">
                                            {sale.isUnallocated && (
                                                <div className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 animate-pulse">
                                                    ⚠️ Un-Allocated Return
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-bold text-[#17316c] uppercase whitespace-nowrap">Invoice</label>
                                                <input
                                                    ref={invoiceInputRef}
                                                    type="text"
                                                    className="flex-1 px-3 py-1.5 bg-white border border-[#94a3b8] rounded-sm font-bold text-[#1e293b] outline-none focus:border-[#17316c] focus:ring-1 focus:ring-[#17316c]/20"
                                                    value={invoiceNoInput}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setInvoiceNoInput(val);
                                                        setSale({ ...sale, isUnallocated: false, headerDetails: { ...sale.headerDetails, originalInvoiceNo: val } });
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.shiftKey && e.key === '?') {
                                                            e.preventDefault();
                                                            if (sale.customer) {
                                                                setModals(m => ({ ...m, invoiceLookup: true }));
                                                            } else {
                                                                notify({
                                                                    message: "CUSTOMER REQUIRED: Please select or search for a customer before looking up invoices.",
                                                                    type: "warning",
                                                                    displayTime: 4000,
                                                                    position: { at: "top center", my: "top center", offset: "0 50" }
                                                                });
                                                                customerInputRef.current?.focus();
                                                            }
                                                        }
                                                    }}
                                                    placeholder="Enter Invoice No"
                                                />
                                            </div>
                                            {!sale.isUnallocated && <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">(Shift + ? for lookup)</div>}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-[#17316c] uppercase">CREDIT LIMIT</label>
                                        <div className="text-base font-bold text-[#334155]">
                                            R {sale.customer?.creditLimit?.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) || '0.00'}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-[#17316c] uppercase">BALANCE</label>
                                        <div className="text-base font-bold text-[#334155]">
                                            R {sale.customer?.balance?.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) || '0.00'}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-[#cbd5e1] pt-1 mt-auto">
                                        <label className="text-sm font-bold text-[#17316c] uppercase">AVAILABLE</label>
                                        <div className="text-lg font-black text-[#17316c]">
                                            R {((sale.customer?.creditLimit || 0) - (sale.customer?.balance || 0)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 bg-white border-t border-[#cbd5e1] flex items-center justify-between shrink-0">
                    <button
                        className="px-6 py-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-black text-sm rounded-sm transition-all active:scale-[0.98] shadow-sm uppercase tracking-tight"
                        onClick={handleAbortTrigger}
                    >
                        ESC ABORT TRANSACTION
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            className="px-6 py-2 bg-[#eceff1] hover:bg-[#cfd8dc] text-[#546e7a] font-black text-sm rounded-sm transition-all active:scale-[0.98] shadow-sm uppercase tracking-tight"
                            onClick={() => setModals(m => ({ ...m, customerCapture: true }))}
                        >
                            F6 CREATE DEBTOR
                        </button>
                        {isReturn && (
                            <button
                                className="px-6 py-2 bg-[#17316c] hover:bg-[#0f1d3a] text-white font-black text-sm rounded-sm transition-all active:scale-[0.98] shadow-sm uppercase tracking-tight"
                                onClick={handleUnallocatedTransaction}
                            >
                                F5 UNALLOCATED TRANSACTION
                            </button>
                        )}
                        <button
                            className={`
                                px-12 py-2 font-black text-sm transition-all active:scale-[0.98] shadow-sm rounded-sm uppercase tracking-tight
                                ${!sale.customer
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-[#43a047] hover:bg-[#2e7d32] text-white'}
                            `}
                            disabled={!sale.customer}
                            onClick={handleProceed}
                        >
                            F10 PROCEED
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
