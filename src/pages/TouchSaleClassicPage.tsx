import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { SaleState, CartItem, Payment, Product, Customer } from '../types/domain.types';
import { VAT_RATE, MOCK_PRODUCTS, USE_MOCK_DATA, CASH_CUSTOMER } from '../data/mockData';
import { formatCurrency } from '../utils/formatters';
import { calculateLineDiscount } from '../utils/calculations';
import { ProductSearchWithKeyboardModal } from '../components/modals/ProductSearchWithKeyboardModal';
import { CustomerSearchWithKeyboardModal } from '../components/modals/CustomerSearchWithKeyboardModal';
import { TenderModal } from '../components/modals/TenderModal';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import DataGrid, {
    Column,
    Editing,
    Scrolling,
    Selection as DxSelection,
    KeyboardNavigation,
    Paging,
    Lookup
} from 'devextreme-react/data-grid';

import 'devextreme/dist/css/dx.light.compact.css';

import { transformApiCustomer } from '../utils/transformers';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const TouchSaleClassicPage = ({ sale, setSale, onBack, onComplete, user }: { sale: SaleState, setSale: (s: SaleState) => void, onBack: () => void, onComplete: () => void, user: string | null }) => {
    const [modals, setModals] = useState({ tender: false, confirm: false, product: false, customer: false, priceCheckSearch: false });
    const [docNumber, setDocNumber] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [nextItemQuantity, setNextItemQuantity] = useState('1');
    const [orderSaving, setOrderSaving] = useState(false);
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [discountInput, setDiscountInput] = useState('');
    const [discountType, setDiscountType] = useState<'P' | 'V'>('P');
    const [discountValue, setDiscountValue] = useState(0);

    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [productsLoading, setProductsLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([CASH_CUSTOMER]);

    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const { items, customer } = sale;

    const activeItem = items.find(i => i.id === activeItemId);

    useEffect(() => {
        const loadData = async () => {
            if (USE_MOCK_DATA) return;
            setProductsLoading(true);
            try {
                const customerData = await api.customers.getAll({ pageno: 1, recordsperpage: 500 });
                const transformedCustomers = customerData.map(transformApiCustomer);
                if (transformedCustomers.length > 0) {
                    setCustomers([CASH_CUSTOMER, ...transformedCustomers]);
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setProductsLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (activeItem) {
            setDiscountInput(activeItem.discount.toString());
            setDiscountType(activeItem.discountType);
            setDiscountValue(calculateLineDiscount(activeItem));
        } else {
            setDiscountInput('');
            setDiscountType('P');
            setDiscountValue(0);
        }
    }, [activeItem]);

    useEffect(() => {
        if (items.length > 0 && activeItemId === null) {
            setActiveItemId(items[items.length - 1].id);
        }
    }, [items, activeItemId]);

    const updateItems = useCallback((newItems: CartItem[]) => {
        setSale({ ...sale, items: newItems });
    }, [sale, setSale]);

    const subTotal = items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
    const totalDiscount = items.reduce((sum: number, item: CartItem) => sum + calculateLineDiscount(item), 0);
    const subTotalAfterDiscount = subTotal - totalDiscount;
    const vatAmount = subTotalAfterDiscount * VAT_RATE;
    const total = subTotalAfterDiscount + vatAmount;

    const handleDiscountChange = (value: string, type: 'P' | 'V') => {
        if (!activeItemId) return;

        const newItems = items.map(item => {
            if (item.id === activeItemId) {
                return { ...item, discount: parseFloat(value) || 0, discountType: type };
            }
            return item;
        });
        updateItems(newItems);
    };

    const handleUpdateItem = (itemId: string, field: keyof CartItem, value: string | number) => {
        const newItems = items.map(item => {
            if (item.id === itemId) {
                return { ...item, [field]: value };
            }
            return item;
        });
        updateItems(newItems);
    };

    const addProductToCart = useCallback((product: Product) => {
        const quantityToAdd = parseInt(nextItemQuantity, 10) || 1;
        const existingItem = items.find(i => i.productId === product.id);
        let newActiveId = '';
        if (existingItem) {
            const newItems = items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + quantityToAdd } : i);
            updateItems(newItems);
            newActiveId = existingItem.id;
        } else {
            const newCartItem: CartItem = {
                id: `cart_item_${product.id}_${Date.now()}`,
                productId: product.id,
                description: product.description,
                quantity: quantityToAdd,
                price: product.price,
                discount: 0,
                discountType: 'P',
            };
            updateItems([...items, newCartItem]);
            newActiveId = newCartItem.id;
        }
        setActiveItemId(newActiveId);
        setNextItemQuantity('1');
    }, [items, updateItems, nextItemQuantity]);

    const handleBarcodeEnter = useCallback(() => {
        if (!barcodeInput.trim()) return;
        const foundProduct = products.find(p =>
            p.id.toLowerCase() === barcodeInput.toLowerCase() ||
            p.description.toLowerCase().includes(barcodeInput.toLowerCase())
        );
        if (foundProduct) {
            addProductToCart(foundProduct);
            setBarcodeInput('');
        } else {
            alert(`Product with code "${barcodeInput}" not found.`);
        }
    }, [barcodeInput, addProductToCart, products]);

    const handleKeypadClick = (key: string) => {
        if (key === 'Clear') {
            setBarcodeInput('');
        } else if (key === 'Enter') {
            handleBarcodeEnter();
        } else {
            setBarcodeInput(prev => prev + key);
        }
        barcodeInputRef.current?.focus();
    };

    const handleProceedToPay = useCallback(() => {
        if (items.length === 0) return;
        if (orderSaving) return;
        setModals(m => ({ ...m, tender: true }));
    }, [items, orderSaving]);

    const handleTender = async (payments?: Payment[]) => {
        if (USE_MOCK_DATA) {
            setDocNumber(Date.now().toString().slice(-8));
            setModals({ tender: false, confirm: true, product: false, customer: false, priceCheckSearch: false });
            return;
        }

        setOrderSaving(true);
        try {
            const orderDetails = items.map((item: CartItem, index: number) => ({
                ORDLINENO: index + 1,
                ORDSTKCODE: item.productId || '',
                ORDDESC: item.description,
                ORDQTY: item.quantity,
                ORDPRICE: item.price,
                ORDDISCPERC: item.discountType === 'P' ? item.discount : 0,
                ORDDISCAMT: item.discountType === 'V' ? item.discount : 0,
                ORDLINETOTAL: (item.price * item.quantity) - calculateLineDiscount(item),
                ORDVATRATE: VAT_RATE * 100,
            }));

            const orderHeader = {
                ORDDATE: getTodayDateString(),
                ORDCUSTCODE: customer?.id || 'CASH',
                ORDCUSTNAME: customer?.name || 'CASH SALE',
                TXTP: 'POSCSH',
                ORDSTATUS: 'NEW',
                ORDTYPE: 'SALE',
                ORDWHCODE: sale.headerDetails?.warehouse?.split('-')[0] || '01',
                ORDSALESREP: sale.headerDetails?.salesRep?.split('-')[0] || '',
                ORDVATINDICATOR: 'I',
                ORDSUBTOTAL: subTotalAfterDiscount,
                ORDVAT: vatAmount,
                ORDTOTAL: total,
            } as any;

            let orderPayments;
            if (payments && payments.length > 0) {
                orderPayments = payments.map((p, index) => ({
                    PAYLINENO: index + 1,
                    PAYTENDERCODE: p.method === 'Cash' ? 'CASH' : p.method === 'Credit Card' ? 'CARD' : p.method === 'EFT' ? 'EFT' : 'CASH',
                    PAYAMOUNT: p.amount,
                }));
            }

            const result = await api.orders.create({
                header: orderHeader,
                details: orderDetails,
                payments: orderPayments,
            });

            const docNo = (result as any)?.ORDNO || (result as any)?.header?.ORDNO || Date.now().toString().slice(-8);
            setDocNumber(docNo);
            setModals({ tender: false, confirm: true, product: false, customer: false, priceCheckSearch: false });
        } catch (error: any) {
            console.error('Failed to create order:', error);
            if (window.confirm(`API Error: ${error.message}\n\nDo you want to continue with offline mode?`)) {
                setDocNumber('OFF-' + Date.now().toString().slice(-6));
                setModals({ tender: false, confirm: true, product: false, customer: false, priceCheckSearch: false });
            }
        } finally {
            setOrderSaving(false);
        }
    };

    const handleSelectProductFromSearch = (product: Product) => {
        addProductToCart(product);
        setModals(m => ({ ...m, product: false, priceCheckSearch: false }));
    };

    const handleSelectCustomer = (selectedCustomer: Customer) => {
        setSale({ ...sale, customer: selectedCustomer });
        setModals(m => ({ ...m, customer: false }));
    };

    const handleRemoveItem = (itemId: string) => {
        const itemIndex = items.findIndex(i => i.id === itemId);
        const newItems = items.filter(i => i.id !== itemId);
        updateItems(newItems);
        if (activeItemId === itemId) {
            if (newItems.length === 0) setActiveItemId(null);
            else if (itemIndex >= newItems.length) setActiveItemId(newItems[newItems.length - 1].id);
            else setActiveItemId(newItems[itemIndex].id);
        }
    };

    const handleSupervisor = () => { alert('Supervisor function not implemented in demo'); };
    const handleVoidSale = () => { if (window.confirm('Are you sure you want to void this sale?')) { updateItems([]); } };
    const handleOpenPriceChecker = () => setModals(m => ({ ...m, priceCheckSearch: true }));

    return (
        <>
            <ProductSearchWithKeyboardModal isOpen={modals.product || modals.priceCheckSearch} onClose={() => setModals(m => ({ ...m, product: false, priceCheckSearch: false }))} onSelectProduct={handleSelectProductFromSearch} />
            <CustomerSearchWithKeyboardModal isOpen={modals.customer} onClose={() => setModals(m => ({ ...m, customer: false }))} onSelectCustomer={handleSelectCustomer} customers={customers} />
            <TenderModal isOpen={modals.tender} onClose={() => setModals(m => ({ ...m, tender: false }))} onTender={handleTender} sale={sale} isSaving={orderSaving} />
            <ConfirmationModal isOpen={modals.confirm} onClose={onComplete} docNumber={docNumber} />

            <style>
                {`
                    .dx-datagrid-headers { background-color: #17316c !important; color: white !important; }
                    .dx-datagrid-headers .dx-header-row > td { 
                        padding: 10px 12px !important; 
                        font-size: 8px !important; 
                        font-weight: 900 !important; 
                        text-transform: uppercase !important;
                        letter-spacing: 0.1em !important;
                        color: white !important;
                        opacity: 0.9;
                    }
                    .dx-datagrid-rowsview .dx-row-focused.dx-data-row > td {
                         background-color: #f1f5f9 !important; 
                         color: #17316c !important; 
                    }
                    .dx-datagrid-rowsview .dx-selection.dx-row > td {
                         background-color: #f1f5f9 !important; 
                         color: #17316c !important; 
                    }
                `}
            </style>

            <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
                {/* Header Section - Compact */}
                <header className="bg-[#17316c] border-b border-[#17316c]/30 shrink-0 shadow-xl z-30">
                    <div className="px-5 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-white tracking-tighter leading-none">VISION POS</span>
                            <span className="px-2 py-0.5 bg-white/10 text-white/80 text-[8px] font-black rounded-full uppercase tracking-widest border border-white/10">TOUCH SALE</span>
                            <span className="px-2 py-0.5 bg-white/5 text-white/60 text-[8px] font-black rounded-full uppercase tracking-widest">TILL 01</span>
                        </div>
                        <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none">Operator</span>
                            <span className="text-[10px] font-black text-white/90 leading-none">{user || 'Admin'}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-black text-white tabular-nums drop-shadow-sm">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block -mt-1">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden lg:flex-row flex-col">
                    <div className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl relative z-20">
                        {/* Transaction Status Bar */}
                        {/* Transaction Status Bar - Premium Polish */}
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#17316c]"></div>
                            <div className="flex items-center gap-10 relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Sale Mode</span>
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        <span className="text-xs font-black text-[#17316c] leading-none uppercase tracking-tight">Standard Sale</span>
                                    </div>
                                </div>
                                <div className="flex flex-col border-l border-slate-200 pl-10">
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Customer / Account</span>
                                    <span className="text-xs font-black text-slate-800 leading-none uppercase tracking-tight">
                                        {customer ? (customer.id === 'CASH' ? '💰 CASH SALE' : `👤 ${customer.name}`) : '⚠️ NO CUSTOMER SELECTED'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col text-right relative z-10">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Account reference</span>
                                <span className="text-xs font-black text-[#17316c] leading-none uppercase tracking-widest">{customer?.id || '---'}</span>
                            </div>
                        </div>

                        {/* Cart Header */}
                        {/* Cart Header - Premium Polish */}
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#17316c]/5 flex items-center justify-center text-[#17316c]">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-xs font-black text-[#17316c] uppercase tracking-wider">Cart Contents</h3>
                                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Real-time inventory sync active</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-[#17316c] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[#17316c]/20">
                                    {items.length} units
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden dx-viewport">
                            <DataGrid
                                dataSource={items}
                                keyExpr="id"
                                showBorders={false}
                                showRowLines={true}
                                columnAutoWidth={true}
                                allowColumnResizing={true}
                                rowAlternationEnabled={true}
                                focusedRowEnabled={true}
                                hoverStateEnabled={true}
                                height="100%"
                                onSelectionChanged={(e) => setActiveItemId(e.selectedRowKeys[0] || null)}
                                selectedRowKeys={activeItemId ? [activeItemId] : []}
                                onRowUpdated={(e) => {
                                    const updatedItems = items.map(item => item.id === e.key ? { ...item, ...e.data } : item);
                                    updateItems(updatedItems);
                                }}
                            >
                                <DxSelection mode="single" />
                                <KeyboardNavigation
                                    enterKeyAction="moveFocus"
                                    enterKeyDirection="column"
                                    editOnKeyPress={true}
                                />
                                <Scrolling mode="virtual" />
                                <Paging enabled={false} />
                                <Editing
                                    mode="cell"
                                    allowUpdating={true}
                                    startEditAction="click"
                                />

                                <Column
                                    dataField="productId"
                                    caption="Code"
                                    allowEditing={false}
                                    width={100}
                                    cellRender={(data: any) => <span className="font-black text-slate-500 tabular-nums text-[10px]">{data.value}</span>}
                                />
                                <Column
                                    dataField="description"
                                    caption="Description"
                                    allowEditing={false}
                                    cellRender={(data: any) => <span className="font-bold text-slate-700 text-[11px]">{data.value}</span>}
                                />
                                <Column
                                    dataField="price"
                                    caption="Price"
                                    dataType="number"
                                    format={{ type: 'fixedPoint', precision: 2 }}
                                    width={100}
                                    alignment="right"
                                />
                                <Column
                                    dataField="quantity"
                                    caption="Qty"
                                    dataType="number"
                                    width={70}
                                    alignment="center"
                                />
                                <Column
                                    dataField="discount"
                                    caption="Disc"
                                    dataType="number"
                                    width={70}
                                    alignment="center"
                                />
                                <Column
                                    dataField="discountType"
                                    caption="T"
                                    width={50}
                                    alignment="center"
                                >
                                    <Lookup
                                        dataSource={[{ id: 'P', name: '%' }, { id: 'V', name: 'V' }]}
                                        valueExpr="id"
                                        displayExpr="name"
                                    />
                                </Column>
                                <Column
                                    caption="Amt"
                                    width={90}
                                    alignment="right"
                                    allowEditing={false}
                                    cellRender={(data: any) => (
                                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                                            {calculateLineDiscount(data.data).toFixed(2)}
                                        </span>
                                    )}
                                />
                                <Column
                                    caption="Total"
                                    width={100}
                                    alignment="right"
                                    allowEditing={false}
                                    cellRender={(data: any) => (
                                        <span className="text-[11px] font-black text-slate-800 tabular-nums">
                                            {(data.data.price * data.data.quantity - calculateLineDiscount(data.data)).toFixed(2)}
                                        </span>
                                    )}
                                />
                            </DataGrid>
                        </div>
                        <div className="p-2 border-t border-slate-100 bg-white shrink-0">
                            <button
                                className="w-full py-2 bg-red-50 text-red-500 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all hover:bg-red-100 disabled:opacity-30 flex items-center justify-center gap-2 active:scale-[0.98]"
                                onClick={() => activeItemId && handleRemoveItem(activeItemId)}
                                disabled={!activeItemId}
                            >
                                <span className="text-lg">×</span> Remove Selected Item
                            </button>
                        </div>
                        {/* Totals Summary - Premium Plate */}
                        <div className="p-6 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)] flex flex-col gap-4 relative">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#17316c]/10 to-transparent"></div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subtotal</span>
                                    <span className="text-xs font-black text-slate-700 tabular-nums">R {subTotalAfterDiscount.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Savings</span>
                                    <span className="text-xs font-black text-amber-500 tabular-nums">-R {totalDiscount.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tax Output</span>
                                    <span className="text-xs font-black text-slate-700 tabular-nums">R {vatAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="bg-[#17316c]/5 rounded-2xl p-4 flex items-center justify-between border border-[#17316c]/10">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-[#17316c]/40 uppercase tracking-[0.2em] mb-0.5">Payable Balance</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Payable (Inclusive of Tax)</span>
                                </div>
                                <div className="text-right flex flex-col">
                                    <span className="text-3xl font-black text-[#17316c] tracking-tighter tabular-nums leading-none">R {total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-[320px] bg-slate-50 flex flex-col shrink-0 border-l border-slate-200 shadow-xl relative z-30">
                        <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
                            <div className="h-24 bg-[#17316c] rounded-2xl shadow-xl shadow-[#17316c]/10 flex flex-col items-center justify-center p-4 border border-white/10 relative overflow-hidden group">
                                <div className="absolute -top-1 -right-1 opacity-10">
                                    <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-1.12-.13-2.13-.58-3-1.34l1.34-1.34c.64.48 1.34.8 2.13.92V13.8c-1.34-.32-2.34-.84-2.94-1.55-.61-.71-.92-1.55-.92-2.5 0-1.12.38-2.03 1.15-2.73.71-.64 1.63-1.01 2.58-1.09V4h2.82v1.94c.9.11 1.71.49 2.45 1.11l-1.34 1.34c-.5-.4-.99-.64-1.5-.74v2.54c1.34.34 2.34.88 2.94 1.58.61.7.92 1.54.92 2.5 0-1.12-.38-2.03-1.15 2.73-.77.71-1.74 1.09-2.79 1.14zm-2.82-8.56c-.32.06-.61.16-.84.34-.23.18-.34.4-.34.61 0 .23.11.41.34.55.23.14.52.26.84.32v-1.82zm2.82 5.03c.32-.06.61-.17.84-.34.23-.17.34-.39.34-.61 0-.23-.11-.42-.34-.56-.23-.14-.52-.26-.84-.32v1.83z" /></svg>
                                </div>
                                <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.3em] mb-1 relative z-10">Total Payable (ZAR)</span>
                                <div className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-md flex items-baseline relative z-10">
                                    <span className="text-lg opacity-40 mr-2">R</span>
                                    {total.toFixed(2)}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Input / Scanner</label>
                                <div className="relative group">
                                    <input
                                        ref={barcodeInputRef}
                                        type="text"
                                        className="h-12 w-full bg-white border border-slate-200 rounded-xl px-4 text-lg font-black text-slate-800 placeholder:text-slate-200 focus:border-primary/30 focus:shadow-md transition-all outline-none"
                                        placeholder="Scan or Type..."
                                        value={barcodeInput}
                                        onChange={e => setBarcodeInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleBarcodeEnter() }}
                                        autoFocus
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Active</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
                                    <button
                                        key={key}
                                        onClick={() => handleKeypadClick(key)}
                                        className="h-10 bg-white border border-slate-100 rounded-xl text-lg font-black text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.95] flex items-center justify-center"
                                    >
                                        {key}
                                    </button>
                                ))}
                                <button onClick={() => handleKeypadClick('Clear')} className="h-10 bg-slate-100 rounded-xl text-[7px] font-black text-slate-400 uppercase tracking-widest transition-all hover:bg-slate-200 active:scale-[0.95] flex items-center justify-center">CLR</button>
                                <button onClick={() => handleKeypadClick('0')} className="h-10 bg-white border border-slate-100 rounded-xl text-lg font-black text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.95] flex items-center justify-center">0</button>
                                <button onClick={() => handleKeypadClick('.')} className="h-10 bg-white border border-slate-100 rounded-xl text-lg font-black text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.95] flex items-center justify-center">.</button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    className="h-12 flex-1 bg-[#17316c] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-[#17316c]/10 hover:bg-[#17316c]/90 active:scale-[0.95] transition-all flex items-center justify-center gap-2"
                                >
                                    ENTER ACTION
                                </button>
                                <button className="w-16 h-12 bg-slate-100 text-slate-400 rounded-xl transition-all flex items-center justify-center hover:bg-slate-200 active:scale-[0.95] disabled:opacity-50" disabled>
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M20 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 7h-6v-2h6v2z"></path></svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-3 grid grid-cols-2 gap-1.5 bg-white border-t border-slate-100 shrink-0">
                            <button
                                className="h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl font-black text-[7px] uppercase tracking-wider transition-all shadow-md shadow-green-100 bg-green-500 text-white hover:bg-green-600 active:scale-95 disabled:opacity-30"
                                onClick={handleProceedToPay}
                                disabled={items.length === 0}
                            >
                                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"></path></svg>
                                Pay (F10)
                            </button>
                            <button className="h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl font-black text-[7px] uppercase tracking-wider transition-all shadow-sm bg-[#17316c]/5 text-[#17316c] hover:bg-[#17316c]/10 active:scale-95" onClick={() => setModals(m => ({ ...m, product: true }))}>
                                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
                                Find Item
                            </button>
                            <button className="h-11 flex flex-col items-center justify-center gap-0.5 rounded-lg font-black text-[7px] uppercase tracking-wider transition-all shadow-sm bg-sky-50 text-sky-600 hover:bg-sky-100 active:scale-95" onClick={handleOpenPriceChecker}>
                                <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.42l9 9a2 2 0 0 0 2.82 0l7-7a2 2 0 0 0 0-2.84zM6.5 8.5A1.5 1.5 0 1 1 8 7a1.5 1.5 0 0 1-1.5 1.5z"></path></svg>
                                Price Check
                            </button>
                            <button className="h-11 flex flex-col items-center justify-center gap-0.5 rounded-lg font-black text-[7px] uppercase tracking-wider transition-all shadow-sm bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95" onClick={() => setModals(m => ({ ...m, customer: true }))}>
                                <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
                                Customer
                            </button>
                            <button className="h-11 flex flex-col items-center justify-center gap-0.5 rounded-lg font-black text-[7px] uppercase tracking-wider transition-all shadow-sm bg-amber-50 text-amber-600 hover:bg-amber-100 active:scale-95" onClick={handleSupervisor}>
                                <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.58 10.45l-1.03-1.03-1.5-1.5A7.51 7.51 0 0 0 7.95 2.5H4a2 2 0 0 0-2 2v2.12a5.52 5.52 0 0 0 0 10.76V19a2 2 0 0 0 2 2h4.05a7.5 7.5 0 0 0 11.53-6.55zM15 15a4.5 4.5 0 1 1 4.5-4.5A4.5 4.5 0 0 1 15 15z"></path><path d="M15 12a1.5 1.5 0 1 1-1.5-1.5A1.5 1.5 0 0 1 15 12z"></path></svg>
                                Supervisor
                            </button>
                            <button className="h-11 flex flex-col items-center justify-center gap-0.5 rounded-lg font-black text-[7px] uppercase tracking-wider transition-all shadow-sm bg-red-50 text-red-600 hover:bg-red-100 active:scale-95" onClick={handleVoidSale}>
                                <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                                Void Sale
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
                            <button className="w-full h-8 flex items-center justify-center gap-2 rounded-lg font-black text-[7px] uppercase tracking-[0.2em] transition-all bg-white border border-slate-200 text-slate-400 hover:text-[#17316c] hover:border-[#17316c]/20 hover:bg-[#17316c]/5 active:scale-95" onClick={onBack}>
                                <span className="text-xs">←</span> BACK TO MENU
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};
