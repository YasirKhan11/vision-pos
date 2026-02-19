import React, { useState, useEffect, useRef } from 'react';
import { Customer } from '../types/domain.types';
import { api } from '../api';
import { OrderHeader } from '../types/api.types';
import { formatCurrency } from '../utils/formatters';
import { useHotkeys } from '../hooks/useHotkeys';
import { USE_MOCK_DATA, MOCK_SALES_ORDERS, MOCK_QUOTATIONS } from '../data/mockData';
import { transformApiCustomer } from '../utils/transformers';
import { CustomerSearchModal, SearchMode } from '../components/modals/CustomerSearchModal';

// DevExpress Imports
import DataGrid, {
    Column,
    Scrolling,
    Selection,
    Sorting,
    Paging,
    LoadPanel
} from 'devextreme-react/data-grid';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
    compact?: boolean;
}

const MetricCard = ({ label, value, icon, bgColor, iconColor, compact }: MetricCardProps) => (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-100 flex items-center ${compact ? 'p-4 min-w-[200px]' : 'p-6 min-w-[280px]'} flex-1`}>
        <div className={`${compact ? 'w-12 h-12 text-xl mr-4' : 'w-14 h-14 text-2xl mr-5 shadow-sm'} rounded-full ${bgColor} flex items-center justify-center ${iconColor}`}>
            {icon}
        </div>
        <div>
            <div className={`${compact ? 'text-2xl' : 'text-3xl'} font-black text-[#17316c] leading-tight`}>{value}</div>
            <div className={`text-[11px] font-bold text-slate-500 uppercase tracking-wide`}>{label}</div>
        </div>
    </div>
);

interface DashboardPageProps {
    customer: Customer | null;
    type: 'order' | 'quotation';
    onCreateNew: () => void;
    onBack: () => void;
    onCustomerChange: (c: Customer | null) => void;
}

export const DashboardPage = ({ customer, type, onCreateNew, onBack, onCustomerChange }: DashboardPageProps) => {
    const isOrders = type === 'order';
    const title = isOrders ? 'Sales Orders Dashboard' : 'Quotations Dashboard';

    const [accountInput, setAccountInput] = useState(customer?.id || '');
    const [orders, setOrders] = useState<OrderHeader[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [searchedCustomers, setSearchedCustomers] = useState<Customer[]>([]);
    const [customerLoading, setCustomerLoading] = useState(false);

    const accountInputRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<any>(null);

    const handleCustomerSearch = async (searchTerm: string, mode: SearchMode = 'account') => {
        setCustomerLoading(true);
        try {
            const params: any = {};
            if (searchTerm) {
                params.recordsperpage = 100;
                params.Account = `like ${searchTerm}`;
            } else {
                // If no search term, load default 500 records without parameters
                params.recordsperpage = 500;
            }

            const results = await api.customers.getAll(params);
            setSearchedCustomers(results.map(transformApiCustomer));
        } catch (error) {
            console.error('Customer search failed:', error);
        } finally {
            setCustomerLoading(false);
        }
    };

    // Focus input on mount
    useEffect(() => {
        if (!customer) {
            accountInputRef.current?.focus();
        }
    }, [customer]);

    useHotkeys({
        'F2': () => customer && onCreateNew(),
        'Escape': onBack,
        'ArrowDown': () => {
            if (orders.length > 0) {
                const currentIndex = orders.findIndex(o => o.ORDNO === selectedRowKeys[0]);
                const nextIndex = Math.min(currentIndex + 1, orders.length - 1);
                if (nextIndex >= 0) setSelectedRowKeys([orders[nextIndex].ORDNO]);
            }
        },
        'ArrowUp': () => {
            if (orders.length > 0) {
                const currentIndex = orders.findIndex(o => o.ORDNO === selectedRowKeys[0]);
                const prevIndex = Math.max(currentIndex - 1, 0);
                if (prevIndex >= 0) setSelectedRowKeys([orders[prevIndex].ORDNO]);
            }
        }
    }, [onCreateNew, onBack, customer, orders, selectedRowKeys]);

    // Sync input with prop
    useEffect(() => {
        if (customer) setAccountInput(customer.id);
    }, [customer]);

    const handleAccountSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const searchTerm = accountInput.trim();

        // If empty, it will trigger handleCustomerSearch('') which loads 500 records
        setIsCustomerSearchOpen(true);
        handleCustomerSearch(searchTerm);
    };

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            if (!customer) {
                setOrders([]);
                return;
            }

            if (USE_MOCK_DATA) {
                const mockSource = isOrders ? MOCK_SALES_ORDERS : MOCK_QUOTATIONS;
                const mapped = mockSource.map(m => ({
                    ORDNO: m.id,
                    ORDDATE: m.date,
                    ORDTOTAL: m.total,
                    ORDSTATUS: m.status as any,
                    ORDDELIVERYDATE: (m as any).deliveryDate,
                    ORDCUSTCODE: customer.id,
                    ORDTYPE: isOrders ? 'SALE' : 'QUOTE',
                    ORDCUSTNAME: customer.name,
                    ORDNETTOTAL: m.total,
                    ORDVAT: 0,
                    ORDSUBTOTAL: m.total,
                    ORDREF: (m as any).reference || '',
                    TXTP: isOrders ? 'DEBSOR' : 'DEBQOT'
                } as OrderHeader));
                setOrders(mapped);
                if (mapped.length > 0) setSelectedRowKeys([mapped[0].ORDNO]);
                return;
            }

            setLoading(true);
            try {
                const results = await api.sales.orders.getAll({
                    Account: customer.account || customer.id,
                    recordsperpage: 100,
                    TXTP: isOrders ? 'DEBSOR' : 'DEBQOT'
                });

                let finalOrders = results || [];
                // API returns lowercase field names (docno, txtp, etc.)
                if (results && results.length > 0) {
                    const firstItem: any = results[0];
                    // Check if API returned lowercase fields
                    if (firstItem.txtp !== undefined) {
                        // Already filtered by TXTP parameter, no need to filter again
                        finalOrders = results;
                    } else if (firstItem.TXTP === undefined) {
                        // Fallback: filter by type if txtp field is missing
                        finalOrders = results.filter((o: any) =>
                            isOrders ? (o.txtp !== 'DEBQOT') : (o.txtp === 'DEBQOT')
                        );
                    }
                }
                setOrders(finalOrders);
                if (finalOrders.length > 0) {
                    const firstOrder: any = finalOrders[0];
                    setSelectedRowKeys([firstOrder.docno || firstOrder.ORDNO]);
                }
            } catch (error) {
                console.error('Failed to load history:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [customer?.id, isOrders]);

    // Metrics Calculation - handle both uppercase and lowercase field names
    const openCount = orders.filter((o: any) => o.status === 'O' || o.status === 'A' || o.ORDSTATUS === 'O' || o.ORDSTATUS === 'A').length;
    const backOrdersCount = orders.filter((o: any) => o.status === 'B' || o.ORDSTATUS === 'B').length;
    const totalValue = orders.reduce((sum, o: any) => sum + (o.totalincl || o.mantotal || o.ORDTOTAL || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const dueTodayCount = orders.filter((o: any) => o.deliverydate?.startsWith(today) || o.ORDDELIVERYDATE?.startsWith(today)).length;

    return (
        <div className="flex flex-col h-full w-full bg-white font-sans select-none text-[#1e293b] overflow-hidden">
            <CustomerSearchModal
                isOpen={isCustomerSearchOpen}
                onClose={() => setIsCustomerSearchOpen(false)}
                onSelectCustomer={(c) => {
                    onCustomerChange(c);
                    setIsCustomerSearchOpen(false);
                }}
                customers={searchedCustomers}
                loading={customerLoading}
                onSearch={handleCustomerSearch}
                hideFilters={true}
            />

            {/* HEADER: Solid Primary Blue background for both */}
            <div className="bg-[#17316c] text-white px-8 py-3 shrink-0 flex justify-between items-center shadow-md z-10">
                <h1 className="text-2xl font-black uppercase tracking-tight">{title}</h1>
            </div>

            {/* CUSTOM STYLES for Global components */}
            <style>
                {`
                .dashboard-grid .dx-datagrid-headers { background-color: #17316c !important; color: white !important; font-weight: bold; }
                .dashboard-grid .dx-datagrid-headers .dx-header-row > td { color: white !important; padding: 14px 16px !important; font-size: 13px !important; font-weight: 700 !important; border-bottom: none !important; }
                .dashboard-grid .dx-datagrid-rowsview .dx-selection.dx-row > td { background-color: #f1f5f9 !important; color: #17316c !important; }
                .dashboard-grid .dx-datagrid-rowsview .dx-row > td { padding: 12px 16px !important; font-size: 14px !important; border-bottom: 1px solid #f1f5f9 !important; }
                `}
            </style>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* ACCOUNT PICKER: Moved into body for both view, fieldset style */}
                <div className="p-8 pb-0 shrink-0">
                    <div className="relative inline-block w-80">
                        <label className="absolute -top-2.5 left-4 px-1.5 bg-white text-[11px] font-black text-slate-400 uppercase z-10 tracking-wider">
                            Customer Account
                        </label>
                        <div className="flex items-center border-2 border-slate-200 rounded-lg p-0.5 bg-white focus-within:border-[#17316c] transition-all group shadow-sm">
                            <input
                                ref={accountInputRef}
                                type="text"
                                className="w-full px-3 py-2.5 outline-none font-black text-[#17316c] uppercase text-lg bg-transparent border-none focus:ring-0"
                                value={accountInput}
                                onChange={(e) => setAccountInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAccountSubmit(e);
                                    if (e.key === '?') {
                                        e.preventDefault();
                                        handleAccountSubmit();
                                    }
                                }}
                                placeholder=""
                            />
                            <div className="flex items-center pr-3 gap-2 border-l border-slate-200 ml-2 pl-3 group-focus-within:border-[#17316c]">
                                {accountInput && (
                                    <button onClick={() => { setAccountInput(''); onCustomerChange(null); }} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                                <button className="p-1.5 text-[#17316c] hover:bg-slate-50 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </button>
                                <button className="p-1.5 text-[#17316c] hover:bg-slate-50 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* METRICS ROW */}
                <div className="px-8 py-8 shrink-0 flex items-center gap-4 overflow-x-auto no-scrollbar">
                    {isOrders ? (
                        <>
                            <MetricCard label="Open Orders" value={openCount} icon="📦" bgColor="bg-blue-50" iconColor="text-blue-500" compact />
                            <MetricCard label="Back Orders" value={backOrdersCount} icon="⏳" bgColor="bg-orange-50" iconColor="text-orange-500" compact />
                            <MetricCard label="Over 30 Days" value={0} icon="📅" bgColor="bg-indigo-50" iconColor="text-indigo-500" compact />
                            <MetricCard label="Due Today" value={dueTodayCount} icon="🚚" bgColor="bg-green-50" iconColor="text-green-500" compact />
                            <MetricCard label="Due Tomorrow" value={0} icon="➡️" bgColor="bg-cyan-50" iconColor="text-cyan-500" compact />
                        </>
                    ) : (
                        <>
                            <MetricCard label="Open Quotes" value={openCount} icon={<span className="text-3xl">📋</span>} bgColor="bg-orange-50" iconColor="text-orange-500" />
                            <MetricCard label="Total Value" value={formatCurrency(totalValue)} icon={<span className="text-3xl">💰</span>} bgColor="bg-blue-50" iconColor="text-[#17316c]" />
                        </>
                    )}
                </div>

                {/* DATA GRID */}
                <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
                    <div className="flex-1 border border-slate-100 rounded-xl overflow-hidden dashboard-grid shadow-sm bg-white">
                        <DataGrid
                            ref={gridRef}
                            dataSource={orders}
                            keyExpr="docno"
                            showBorders={false}
                            focusedRowEnabled={true}
                            hoverStateEnabled={true}
                            selectedRowKeys={selectedRowKeys}
                            onSelectionChanged={(e) => setSelectedRowKeys(e.selectedRowKeys)}
                            height="100%"
                            className="h-full font-sans"
                            columnAutoWidth={true}
                        >
                            <Selection mode="single" />
                            <Scrolling mode="virtual" />
                            <Sorting mode="single" />
                            <Paging enabled={false} />
                            <LoadPanel enabled={loading} />

                            <Column dataField="docno" caption="Document No." />
                            {isOrders ? (
                                <>
                                    <Column
                                        dataField="trandate"
                                        caption="Order Date"
                                        dataType="date"
                                        format="yyyy/MM/dd"
                                        calculateCellValue={(data: any) => data.trandate?.split('T')[0]?.replace(/-/g, '/')}
                                    />
                                    <Column
                                        dataField="deliverydate"
                                        caption="Delivery Date"
                                        dataType="date"
                                        format="yyyy/MM/dd"
                                        calculateCellValue={(data: any) => data.deliverydate?.split('T')[0]?.replace(/-/g, '/') || '-'}
                                    />
                                </>
                            ) : (
                                <Column
                                    dataField="trandate"
                                    caption="Date"
                                    dataType="date"
                                    format="yyyy/MM/dd"
                                    calculateCellValue={(data: any) => data.trandate?.split('T')[0]?.replace(/-/g, '/')}
                                />
                            )}
                            <Column
                                dataField="totalincl"
                                caption="Total"
                                alignment="right"
                                dataType="number"
                                format={{ type: 'currency', precision: 2 }}
                                calculateCellValue={(data: any) => data.totalincl || data.mantotal || 0}
                            />
                            <Column
                                dataField="status"
                                caption="Status"
                                alignment="center"
                                cellRender={(data: any) => <span className="font-bold text-[#17316c] opacity-80">{data.value || 'A'}</span>}
                            />
                        </DataGrid>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                    <button
                        onClick={onBack}
                        className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-black uppercase rounded shadow-sm transition-all"
                    >
                        ESC Back to Menu
                    </button>

                    <button
                        onClick={() => customer && onCreateNew()}
                        disabled={!customer}
                        className={`px-10 py-2.5 text-[11px] font-black uppercase rounded shadow-sm transition-all text-white ${!customer ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#43a047] hover:bg-[#2e7d32] shadow-[#43a047]/20'}`}
                    >
                        F2 Add {isOrders ? 'Order' : 'Quotation'}
                    </button>
                </div>
            </div>
        </div>
    );
};
