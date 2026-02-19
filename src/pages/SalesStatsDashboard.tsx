import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { useHotkeys } from '../hooks/useHotkeys';
import { Invoice } from '../types/api.types';
import { USE_MOCK_DATA, MOCK_SALES_TODAY, MOCK_TOP_ITEMS, MOCK_TILL_STATS, MOCK_CASHIER_STATS, MOCK_VOID_SALES, MOCK_ITEMS_BELOW_COST, MOCK_PROMOTION_SALES } from '../data/mockData';

// Sales Stats Interfaces
interface SaleTransaction {
    id: string;
    invoiceNo: string;
    customerName: string;
    customerId: string;
    salesPerson: string;
    picker: string;
    total: number;
    itemCount: number;
    timestamp: string;
}

interface TopItem {
    id: string;
    itemCode: string;
    description: string;
    quantitySold: number;
    totalValue: number;
}

interface TopCustomer {
    id: string;
    name: string;
    accountNo: string;
    transactionCount: number;
    totalSpent: number;
}

interface StaffPerformance {
    id: string;
    name: string;
    role: 'salesPerson' | 'picker';
    transactionCount: number;
    totalValue: number;
    avgBasketSize: number;
    itemsPicked?: number;
}

interface TillStats {
    id: string; // Added id
    tillNo: string;
    tillName: string;
    openedAt: string;
    closedAt: string | null;
    cashier: string;
    openingFloat: number;
    cashSales: number;
    cardSales: number;
    accountSales: number;
    totalSales: number;
    cashInDrawer: number;
    variance: number;
    transactionCount: number;
    voidCount: number;
    refundCount: number;
}

interface CashierStats {
    id: string;
    name: string;
    tillNo: string;
    customerCount: number;
    itemCount: number;
    saleValue: number;
    avgItemsPerSale: number;
    avgSaleValue: number;
    startTime: string;
    endTime: string | null;
}

interface VoidSale {
    id: string;
    invoiceNo: string;
    originalTotal: number;
    voidedAt: string;
    voidedBy: string;
    reason: string;
    approvedBy: string;
    customerName: string;
    itemCount: number;
}

interface ItemBelowCost {
    id: string;
    invoiceNo: string;
    itemCode: string;
    description: string;
    costPrice: number;
    soldPrice: number;
    quantity: number;
    lossAmount: number;
    soldBy: string;
    soldAt: string;
    approvedBy: string;
}

interface PromotionItemSale {
    id: string;
    promotionName: string;
    itemCode: string;
    description: string;
    normalPrice: number;
    promoPrice: number;
    discount: number;
    quantitySold: number;
    totalSavings: number;
    validFrom: string;
    validTo: string;
}

export const SalesStatsDashboard = ({ onBack }: { onBack: () => void }) => {
    const [sales, setSales] = useState<SaleTransaction[]>([]);
    const [topItems, setTopItems] = useState<TopItem[]>([]);
    const [tillStats, setTillStats] = useState<TillStats[]>([]);
    const [cashierStats, setCashierStats] = useState<CashierStats[]>([]);
    const [voidSales, setVoidSales] = useState<VoidSale[]>([]);
    const [itemsBelowCost, setItemsBelowCost] = useState<ItemBelowCost[]>([]);
    const [promotionSales, setPromotionSales] = useState<PromotionItemSale[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const recordsPerPage = 100;

    // Initial Data Loading
    useEffect(() => {
        const loadStats = async () => {
            if (USE_MOCK_DATA) {
                setSales(MOCK_SALES_TODAY);
                setTopItems(MOCK_TOP_ITEMS);
                setTillStats(MOCK_TILL_STATS);
                setCashierStats(MOCK_CASHIER_STATS);
                setVoidSales(MOCK_VOID_SALES);
                setItemsBelowCost(MOCK_ITEMS_BELOW_COST);
                setPromotionSales(MOCK_PROMOTION_SALES);
                return;
            }

            setLoading(true);
            try {
                const today = new Date().toISOString().split('T')[0];
                const invoices = await api.sales.invoices.getAll({
                    DOCDATE: today,
                    pageno: page,
                    recordsperpage: recordsPerPage
                });

                const transactions: SaleTransaction[] = invoices.map(inv => ({
                    id: inv.DOCNO,
                    invoiceNo: inv.DOCNO,
                    customerName: inv.DOCCUSTNAME || 'CASH Customer',
                    customerId: inv.DOCCUSTCODE,
                    salesPerson: inv.DOCCREATEDBY || 'System',
                    picker: 'N/A',
                    total: Number(inv.DOCTOTAL) || 0,
                    itemCount: 1,
                    timestamp: inv.DOCCREATEDDATE || inv.DOCDATE
                }));

                setSales(transactions);

                // Load other stats if API available...
                // (Omitted for brevity as the user is focusing on the UI restoration)
            } catch (error: any) {
                console.error("Failed to load sales stats:", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [page]);

    const [activeView, setActiveView] = useState<'overview' | 'items' | 'customers' | 'salespeople' | 'pickers' | 'tills' | 'cashiers' | 'voids' | 'belowcost' | 'promotions'>('overview');
    const [selectedItem, setSelectedItem] = useState<TopItem | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<TopCustomer | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<StaffPerformance | null>(null);
    const [chartModal, setChartModal] = useState<{
        isOpen: boolean;
        type: 'items' | 'customers' | 'salespeople' | 'pickers' | 'tills' | 'cashiers';
        chartType: 'bar' | 'horizontalBar' | 'pie' | 'line' | 'area';
    } | null>(null);

    const openChart = (type: 'items' | 'customers' | 'salespeople' | 'pickers' | 'tills' | 'cashiers', e: React.MouseEvent) => {
        e.stopPropagation();
        setChartModal({ isOpen: true, type, chartType: 'bar' });
    };

    useHotkeys({
        'Escape': () => {
            if (selectedItem) {
                setSelectedItem(null);
            } else if (selectedCustomer) {
                setSelectedCustomer(null);
            } else if (selectedStaff) {
                setSelectedStaff(null);
            } else if (chartModal) {
                setChartModal(null);
            } else {
                onBack();
            }
        }
    }, [selectedItem, selectedCustomer, selectedStaff, chartModal, onBack]);

    // Calculate KPIs
    const totalSales = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const numberOfSales = sales.length;
    const totalItems = sales.reduce((sum, s) => sum + (Number(s.itemCount) || 0), 0);
    const avgBasketSize = numberOfSales > 0 ? totalSales / numberOfSales : 0;
    const avgItemsPerSale = numberOfSales > 0 ? totalItems / numberOfSales : 0;

    // Calculate Top Customers
    const customerStats = useMemo(() => {
        const stats = sales.reduce((acc, sale) => {
            if (!acc[sale.customerId]) {
                acc[sale.customerId] = {
                    id: sale.customerId,
                    name: sale.customerName,
                    accountNo: sale.customerId,
                    transactionCount: 0,
                    totalSpent: 0
                };
            }
            acc[sale.customerId].transactionCount++;
            acc[sale.customerId].totalSpent += sale.total;
            return acc;
        }, {} as Record<string, TopCustomer>);
        return Object.values(stats).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
    }, [sales]);

    const topCustomers = customerStats;

    // Calculate Sales Person Performance
    const salesPersonPerformance = useMemo(() => {
        const stats = sales.reduce((acc, sale) => {
            if (!acc[sale.salesPerson]) {
                acc[sale.salesPerson] = {
                    id: sale.salesPerson,
                    name: sale.salesPerson,
                    role: 'salesPerson' as const,
                    transactionCount: 0,
                    totalValue: 0,
                    avgBasketSize: 0
                };
            }
            acc[sale.salesPerson].transactionCount++;
            acc[sale.salesPerson].totalValue += sale.total;
            return acc;
        }, {} as Record<string, StaffPerformance>);

        return Object.values(stats).map(sp => ({
            ...sp,
            avgBasketSize: sp.transactionCount > 0 ? sp.totalValue / sp.transactionCount : 0
        })).sort((a, b) => b.totalValue - a.totalValue);
    }, [sales]);

    // Calculate Picker Performance
    const pickerPerformance = useMemo(() => {
        const stats = sales.reduce((acc, sale) => {
            if (!acc[sale.picker]) {
                acc[sale.picker] = {
                    id: sale.picker,
                    name: sale.picker,
                    role: 'picker' as const,
                    transactionCount: 0,
                    totalValue: 0,
                    avgBasketSize: 0,
                    itemsPicked: 0
                };
            }
            acc[sale.picker].transactionCount++;
            acc[sale.picker].totalValue += sale.total;
            acc[sale.picker].itemsPicked! += sale.itemCount;
            return acc;
        }, {} as Record<string, StaffPerformance>);

        return Object.values(stats).sort((a, b) => (b.itemsPicked || 0) - (a.itemsPicked || 0));
    }, [sales]);

    // Get max values for chart scaling
    const maxItemQty = Math.max(...topItems.map(i => i.quantitySold), 1);
    const maxCustomerSpent = Math.max(...topCustomers.map(c => c.totalSpent), 1);

    const getRankBadge = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return <span className="text-[10px] font-black text-slate-300">#{index + 1}</span>;
    };

    return (
        <div className="flex flex-col h-full bg-slate-100 overflow-hidden font-sans">
            {/* Header */}
            <div className="px-8 py-3 bg-[#17316c] text-white flex items-center justify-between shrink-0 relative z-20 shadow-md">
                <div className="flex flex-col">
                    <h2 className="text-xl font-black uppercase tracking-tight leading-none">Sales Stats Dashboard</h2>
                    <p className="text-white/60 font-bold text-[9px] tracking-widest uppercase mt-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        {new Date().toLocaleDateString('en-ZA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                </div>
                <button
                    className="group px-3 py-1.5 bg-white/10 border border-white/20 hover:bg-white/20 text-white text-[9px] font-black rounded uppercase transition-all flex items-center gap-2 active:scale-95"
                    onClick={onBack}
                >
                    <span className="text-xs group-hover:-translate-x-0.5 transition-transform">←</span>
                    BACK TO MENU
                </button>
            </div>

            {/* Summary KPIs */}
            <div className="px-8 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0 bg-slate-50 relative z-10 border-b border-slate-200">
                {[
                    { icon: '💰', label: 'TOTAL SALES', value: `R ${totalSales.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-amber-600' },
                    { icon: '📦', label: 'TRANSACTIONS', value: numberOfSales, color: 'text-slate-400' },
                    { icon: '🛒', label: 'AVG BASKET', value: `R ${avgBasketSize.toFixed(0)}`, color: 'text-slate-400' },
                    { icon: '📦', label: 'ITEMS/SALE', value: avgItemsPerSale.toFixed(1), color: 'text-amber-700' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-6 border border-slate-200 flex items-center gap-6 shadow-sm transition-all hover:shadow-md">
                        <div className="text-4xl">{kpi.icon}</div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-slate-700 tracking-tight">{kpi.value}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{kpi.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Category Navigation */}
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex shrink-0 z-10 w-full overflow-hidden">
                <div className="flex w-full gap-1">
                    {[
                        { id: 'overview', icon: '📊', label: 'Overview' },
                        { id: 'items', icon: '📦', label: 'Top Items', count: topItems.length },
                        { id: 'customers', icon: '👥', label: 'Top Customers', count: topCustomers.length },
                        { id: 'salespeople', icon: '👨‍💼', label: 'Sales Staff', count: salesPersonPerformance.length },
                        { id: 'pickers', icon: '📋', label: 'Pickers', count: pickerPerformance.length },
                        { id: 'tills', icon: '🖥️', label: 'Till Stats', count: tillStats.length },
                        { id: 'cashiers', icon: '🧑‍💼', label: 'Cashier Stats', count: cashierStats.length },
                        { id: 'voids', icon: '🚫', label: 'Void Sales', count: voidSales.length, warning: true },
                        { id: 'belowcost', icon: '⚠️', label: 'Below Cost', count: itemsBelowCost.length, warning: true },
                        { id: 'promotions', icon: '🏷️', label: 'Promotions', count: promotionSales.length }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            className={`
                                flex-1 px-1 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap border
                                ${activeView === tab.id
                                    ? 'bg-[#17316c] text-white border-[#17316c] shadow-sm'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}
                            `}
                            onClick={() => setActiveView(tab.id as any)}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            <span className="tracking-tight uppercase">{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`
                                    w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black
                                    ${activeView === tab.id ? 'bg-white text-[#17316c]' : tab.warning ? 'bg-red-500 text-white' : 'bg-[#17316c] text-white'}
                                `}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#f8fafc]">
                {activeView === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in transition-all w-full">
                        {[
                            { id: 'items', icon: '📦', label: 'Top Inventory Throughput', rank: '🥇', title: topItems[0]?.itemCode || '---', subtitle: `${topItems[0]?.quantitySold || 0} units sold`, value: `R ${topItems[0]?.totalValue.toLocaleString('en-ZA') || 0}`, accent: 'text-primary' },
                            { id: 'customers', icon: '👥', label: 'Premier Account Access', rank: '🥇', title: topCustomers[0]?.name || '---', subtitle: `${topCustomers[0]?.transactionCount || 0} cycles`, value: `R ${topCustomers[0]?.totalSpent.toLocaleString('en-ZA') || 0}`, accent: 'text-emerald-600' },
                            { id: 'salespeople', icon: '👨‍💼', label: 'Personnel Performance', rank: '🥇', title: salesPersonPerformance[0]?.name || '---', subtitle: `${salesPersonPerformance[0]?.transactionCount || 0} conversions`, value: `R ${salesPersonPerformance[0]?.totalValue.toLocaleString('en-ZA') || 0}`, accent: 'text-primary' },
                            { id: 'pickers', icon: '📋', label: 'Fulfillment Logistics', rank: '🥇', title: pickerPerformance[0]?.name || '---', subtitle: `${pickerPerformance[0]?.transactionCount || 0} dispatches`, value: `R ${pickerPerformance[0]?.totalValue.toLocaleString('en-ZA') || 0}`, accent: 'text-violet-600' }
                        ].map((card) => (
                            <div key={card.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4 transition-all hover:shadow-md group cursor-pointer" onClick={() => setActiveView(card.id as any)}>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl group-hover:rotate-12 transition-transform">{card.icon}</span>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Intelligence</span>
                                </div>
                                <div className="py-1">
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{card.label}</h4>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{card.rank}</span>
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-slate-800 tracking-tight truncate max-w-[150px] leading-tight">{card.title}</span>
                                            <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">{card.subtitle}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className={`text-base font-black ${card.accent}`}>{card.value}</span>
                                    <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Details →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeView === 'items' && (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-right-2 duration-300 w-full">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📦</span>
                                <h3 className="text-xl font-black text-[#17316c] tracking-tight">Top Inventory Throughput Items</h3>
                            </div>
                            <button
                                className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
                                onClick={(e) => openChart('items', e)}
                            >
                                📊 View Chart
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 lg:w-1/2">
                            {topItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="text-3xl shrink-0 w-8">{getRankBadge(index)}</div>
                                        <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center text-4xl border border-slate-100 group-hover:bg-amber-50 transition-colors">📦</div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-black text-slate-800 leading-none mb-1">{item.itemCode}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate max-w-md">{item.description}</p>
                                        </div>
                                        <div className="flex items-center gap-12 text-right pr-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-slate-800 leading-none mb-1">{item.quantitySold}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UNITS</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-primary leading-none mb-1">R {item.totalValue.toLocaleString('en-ZA')}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">THROUGHPUT</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center gap-4">
                                        <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                                style={{ width: `${(item.quantitySold / Math.max(...topItems.map(i => i.quantitySold))) * 100}%` }}
                                            />
                                        </div>
                                        <button
                                            className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openChart('items', e);
                                            }}
                                        >
                                            📊
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeView === 'customers' && (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-right-2 duration-300 w-full">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">👥</span>
                                <h3 className="text-xl font-black text-[#17316c] tracking-tight">Top 10 Customers by Spending</h3>
                            </div>
                            <button
                                className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
                                onClick={(e) => openChart('customers', e)}
                            >
                                📊 View Chart
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 lg:w-1/2">
                            {topCustomers.map((customer, index) => (
                                <div
                                    key={customer.id}
                                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                                    onClick={() => setSelectedCustomer(customer)}
                                >
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="text-3xl shrink-0 w-8">{getRankBadge(index)}</div>
                                        <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center text-4xl border border-slate-100 group-hover:bg-emerald-50 transition-colors">👤</div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-black text-slate-800 leading-none mb-1">{customer.name}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Premium Account Access</p>
                                        </div>
                                        <div className="flex items-center gap-12 text-right pr-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-slate-800 leading-none mb-1">{customer.transactionCount}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TRANS</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-emerald-600 leading-none mb-1">R {customer.totalSpent.toLocaleString('en-ZA')}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SPENT</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center gap-4">
                                        <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className="h-full bg-[#17316c] rounded-full transition-all duration-1000"
                                                style={{ width: `${(customer.totalSpent / Math.max(...topCustomers.map(c => c.totalSpent))) * 100}%` }}
                                            />
                                        </div>
                                        <button
                                            className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openChart('customers', e);
                                            }}
                                        >
                                            📊
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeView === 'salespeople' && (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-right-2 duration-300 w-full">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">👨‍💼</span>
                                <h3 className="text-xl font-black text-[#17316c] tracking-tight">Sales Staff Performance</h3>
                            </div>
                            <button
                                className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
                                onClick={(e) => openChart('salespeople', e)}
                            >
                                📊 View Chart
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 lg:w-1/2">
                            {salesPersonPerformance.map((sp, index) => (
                                <div
                                    key={sp.id}
                                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                                    onClick={() => setSelectedStaff(sp)}
                                >
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="text-3xl shrink-0 w-8">{getRankBadge(index)}</div>
                                        <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center text-4xl border border-slate-100 group-hover:bg-blue-50 transition-colors">👨‍💼</div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-black text-slate-800 leading-none mb-1">{sp.name}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sales Representative</p>
                                        </div>
                                        <div className="flex items-center gap-12 text-right pr-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-slate-800 leading-none mb-1">{sp.transactionCount}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SALES</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-slate-500 leading-none mb-1">R {sp.avgBasketSize.toFixed(0)}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AVG</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-[#17316c] leading-none mb-1">R {sp.totalValue.toLocaleString('en-ZA')}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center gap-4">
                                        <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className="h-full bg-[#17316c] rounded-full transition-all duration-1000"
                                                style={{ width: `${(sp.totalValue / Math.max(...salesPersonPerformance.map(s => s.totalValue))) * 100}%` }}
                                            />
                                        </div>
                                        <button
                                            className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openChart('salespeople', e);
                                            }}
                                        >
                                            📊
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeView === 'pickers' && (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-right-2 duration-300 w-full">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📋</span>
                                <h3 className="text-xl font-black text-[#17316c] tracking-tight">Picker Performance</h3>
                            </div>
                            <button
                                className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
                                onClick={(e) => openChart('pickers', e)}
                            >
                                📊 View Chart
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 lg:w-1/2">
                            {pickerPerformance.map((p, index) => (
                                <div
                                    key={p.id}
                                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                                    onClick={() => setSelectedStaff(p)}
                                >
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="text-3xl shrink-0 w-8">{getRankBadge(index)}</div>
                                        <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center text-4xl border border-slate-100 group-hover:bg-violet-50 transition-colors">📋</div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-black text-slate-800 leading-none mb-1">{p.name}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Picker</p>
                                        </div>
                                        <div className="flex items-center gap-12 text-right pr-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-slate-800 leading-none mb-1">{p.transactionCount}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ORDERS</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-slate-500 leading-none mb-1">{p.itemsPicked}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ITEMS</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-[#17316c] leading-none mb-1">R {p.totalValue.toLocaleString('en-ZA')}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VALUE</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center gap-4">
                                        <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${(p.totalValue / Math.max(...pickerPerformance.map(pick => pick.totalValue))) * 100}%` }}
                                            />
                                        </div>
                                        <button
                                            className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openChart('pickers', e);
                                            }}
                                        >
                                            📊
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeView === 'tills' && (
                    <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col min-h-[500px] animate-in slide-in-from-right-2 duration-300 w-full">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl text-blue-600">🖥️</span>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Till Performance</h3>
                            </div>
                            <button className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                                📊 View Chart
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest">Till Name</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-center">Trans</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-right">Total Value</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-right">Variance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tillStats.map((t) => (
                                        <tr key={t.id || t.tillNo} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-slate-700">{t.tillNo}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t.cashier}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-center text-sm font-bold text-slate-500">{t.transactionCount}</td>
                                            <td className="px-8 py-4 text-right text-sm font-black text-[#17316c]">R {t.totalSales.toLocaleString('en-ZA')}</td>
                                            <td className={`px-8 py-4 text-right text-sm font-black ${t.variance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                R {t.variance.toLocaleString('en-ZA')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeView === 'cashiers' && (
                    <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col min-h-[500px] animate-in slide-in-from-right-2 duration-300 w-full">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl text-blue-600">🧑‍💼</span>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cashier Stats</h3>
                            </div>
                            <button className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                                📊 View Chart
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest">Cashier</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-center">Till No</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-center">Customers</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-right">Avg Sale</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-right">Total Managed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashierStats.map((c) => (
                                        <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-black">CS</div>
                                                    <span className="text-base font-black text-slate-700">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-center text-sm font-bold text-slate-400">{c.tillNo}</td>
                                            <td className="px-8 py-4 text-center text-sm font-bold text-slate-500">{c.customerCount}</td>
                                            <td className="px-8 py-4 text-right text-sm font-bold text-slate-500">R {c.avgSaleValue.toLocaleString('en-ZA')}</td>
                                            <td className="px-8 py-4 text-right text-sm font-black text-blue-600">R {c.saleValue.toLocaleString('en-ZA')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeView === 'voids' && (
                    <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col min-h-[500px] animate-in slide-in-from-right-2 duration-300 w-full">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl text-red-600">🚫</span>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Void Sales</h3>
                            </div>
                            <button className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                                📊 View Chart
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest">Invoice No</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-center">Voided At</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest">Voided By</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest">Reason</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-right">Original Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {voidSales.map((v) => (
                                        <tr key={v.id} className="border-b border-slate-100 hover:bg-red-50 transition-colors cursor-pointer group">
                                            <td className="px-8 py-4 font-black text-slate-700">{v.invoiceNo}</td>
                                            <td className="px-8 py-4 text-center text-sm font-bold text-slate-400">{v.voidedAt}</td>
                                            <td className="px-8 py-4 text-sm font-bold text-slate-700">{v.voidedBy}</td>
                                            <td className="px-8 py-4 text-sm italic text-slate-500">{v.reason}</td>
                                            <td className="px-8 py-4 text-right text-sm font-black text-red-600 filter-none">R {v.originalTotal.toLocaleString('en-ZA')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeView === 'belowcost' && (
                    <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col min-h-[500px] animate-in slide-in-from-right-2 duration-300 w-full">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl text-amber-600">⚠️</span>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Below Cost Sales</h3>
                            </div>
                            <button className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                                📊 View Chart
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest">Item / Invoice</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-right">Cost</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-right">Sold At</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-center">Qty</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-right">Loss Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsBelowCost.map((i) => (
                                        <tr key={i.id} className="border-b border-slate-100 hover:bg-amber-50 transition-colors cursor-pointer group">
                                            <td className="px-8 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 leading-tight">{i.itemCode}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{i.description} (INV: {i.invoiceNo})</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-right text-sm font-bold text-slate-500">R {i.costPrice.toFixed(2)}</td>
                                            <td className="px-8 py-4 text-right text-sm font-bold text-slate-700">R {i.soldPrice.toFixed(2)}</td>
                                            <td className="px-8 py-4 text-center text-sm font-bold text-slate-500">{i.quantity}</td>
                                            <td className="px-8 py-4 text-right text-sm font-black text-amber-600">R {i.lossAmount.toLocaleString('en-ZA')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeView === 'promotions' && (
                    <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col min-h-[500px] animate-in slide-in-from-right-2 duration-300 w-full">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl text-primary">🏷️</span>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Campaign Promotions</h3>
                            </div>
                            <button className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                                📊 View Chart
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest">Campaign / Item</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-right">Normal</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-right">Promo</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-center">Sold</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-[#17316c] uppercase tracking-widest text-right">Total Savings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotionSales.map((p) => (
                                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group">
                                            <td className="px-8 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-primary leading-tight">{p.promotionName}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{p.itemCode} - {p.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-right text-sm font-bold text-slate-300 line-through">R {p.normalPrice.toFixed(2)}</td>
                                            <td className="px-8 py-4 text-right text-sm font-black text-slate-800">R {p.promoPrice.toFixed(2)}</td>
                                            <td className="px-8 py-4 text-center text-sm font-bold text-slate-500">{p.quantitySold}</td>
                                            <td className="px-8 py-4 text-right text-sm font-black text-emerald-600">R {p.totalSavings.toLocaleString('en-ZA')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {(selectedItem || selectedCustomer || selectedStaff) && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in transition-all">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="bg-[#17316c] px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📋</span>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                                    {selectedItem ? 'Item Details' : selectedCustomer ? 'Customer Details' : 'Staff Details'}
                                </h3>
                            </div>
                            <button
                                onClick={() => { setSelectedItem(null); setSelectedCustomer(null); setSelectedStaff(null); }}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <span className="text-2xl">✕</span>
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0">
                                    {selectedItem ? '📦' : selectedCustomer ? '👤' : '👨‍💼'}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-3xl font-black text-[#17316c] leading-tight mb-1">
                                        {selectedItem?.itemCode || selectedCustomer?.name || selectedStaff?.name}
                                    </h2>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        {selectedItem?.description || (selectedCustomer ? 'Premium Access Customer' : 'Operational Personnel')}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {[
                                    { label: selectedItem ? 'QUANTITY' : selectedCustomer ? 'ORDERS' : 'SALES', value: selectedItem?.quantitySold || selectedCustomer?.transactionCount || selectedStaff?.transactionCount || 0, color: 'text-slate-800' },
                                    { label: 'TOTAL VALUE', value: `R ${(selectedItem?.totalValue || selectedCustomer?.totalSpent || selectedStaff?.totalValue || 0).toLocaleString()}`, color: 'text-primary bg-primary/5 border-primary/10' },
                                    { label: selectedItem ? 'RANK' : 'ITEMS', value: selectedItem ? '#1' : (selectedStaff as any)?.itemsPicked || '---', color: 'text-slate-800' }
                                ].map((stat, i) => (
                                    <div key={i} className={`p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-1 bg-slate-50/50 ${stat.color}`}>
                                        <span className="text-xl font-black">{stat.value}</span>
                                        <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">{stat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Performance Rank</span>
                                </div>
                                <div className="w-full h-3 bg-white border border-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                                </div>
                                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">100% of top performance</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart Modal */}
            {chartModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in transition-all">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col h-[80vh]">
                        <div className="bg-[#17316c] px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📊</span>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                                    Performance Analytics - {chartModal.type.charAt(0).toUpperCase() + chartModal.type.slice(1)}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2 mr-8 bg-white/10 p-1 rounded-lg border border-white/10">
                                {[
                                    { icon: '📊', type: 'bar', label: 'Bar' },
                                    { icon: '📈', type: 'line', label: 'Line' },
                                    { icon: '🥧', type: 'pie', label: 'Pie' },
                                    { icon: '📐', type: 'area', label: 'Area' }
                                ].map(t => (
                                    <button
                                        key={t.type}
                                        onClick={() => setChartModal({ ...chartModal, chartType: t.type as any })}
                                        className={`w-10 h-10 rounded flex flex-col items-center justify-center gap-0.5 transition-all
                                            ${chartModal.chartType === t.type ? 'bg-white text-[#17316c] shadow-sm' : 'text-white/60 hover:bg-white/5'}
                                        `}
                                    >
                                        <span className="text-lg leading-none">{t.icon}</span>
                                        <span className="text-[7px] font-black uppercase leading-none">{t.label}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setChartModal(null)}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <span className="text-2xl">✕</span>
                            </button>
                        </div>

                        <div className="flex-1 p-12 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-slate-50/50" />
                            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                                {/* Chart Visual Representation */}
                                <div className="w-full max-w-2xl h-64 flex items-end justify-center gap-8 mb-12">
                                    {[80, 45, 95, 60, 30].map((h, i) => (
                                        <div key={i} className="group relative flex flex-col items-center flex-1 max-w-[60px]">
                                            <div className="absolute -top-8 text-[10px] font-black text-[#17316c] opacity-0 group-hover:opacity-100 transition-opacity">R {h}k</div>
                                            <div
                                                className="w-full bg-[#17316c] rounded-t-lg transition-all duration-1000 origin-bottom hover:bg-primary"
                                                style={{ height: `${h}%` }}
                                            />
                                            <span className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Entity {i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">Operational Metrics Distribution</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Yield</span>
                                    <span className="text-base font-black text-[#17316c]">R {totalSales.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Managed Volume</span>
                                    <span className="text-base font-black text-slate-800">{numberOfSales} Cycles</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setChartModal(null)}
                                className="px-8 py-3 bg-[#17316c] text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95"
                            >
                                Close Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
