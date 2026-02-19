import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api';
import { StockItem } from '../types/api.types';
import { useHotkeys } from '../hooks/useHotkeys';

// DevExpress Imports
import DataGrid, {
    Column,
    Scrolling,
    Selection,
    Sorting,
    Paging,
    LoadPanel
} from 'devextreme-react/data-grid';

interface InventoryItem {
    id: string;
    itemCode: string;
    description: string;
    category: string;
    onHand: number;
    stockValue: number;
    daysOfStock: number;
    turnoverRate: number;
    status: 'critical' | 'low' | 'optimal' | 'overstock';
}

export const InventoryIntelligenceDashboard = ({ onBack }: { onBack: () => void }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [recordsPerPage] = useState(100);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Grid reference
    const gridRef = useRef<any>(null);

    const mockCategories = ['Brake Parts', 'Filters', 'Ignition', 'Accessories', 'Fluids', 'Electrical'];

    useHotkeys({ 'Escape': onBack }, [onBack]);

    const mapApiToInventory = useCallback((item: any): InventoryItem => {
        // Robust key mapping for both uppercase and lowercase responses
        const stkCode = item.STKCODE || item.stkcode || item.itemcode || item.stockcode || 'N/A';
        const stkDesc = item.STKDESC || item.stkdesc || item.description1 || item.description || 'No Description';

        const onHand = Number(item.STKQTYONHAND || item.stkqtyonhand || item.qtyonhand || item.onhand || 0);
        const minStock = Number(item.STKREORDERPOINT || item.stkreorderpoint || item.reorderpoint || 10);
        const cost = Number(item.STKCOSTPRICE || item.stkcostprice || item.costprice || item.cost || 0);

        const category = item.STKCATEGORY1 || item.stkcategory1 || item.category1 || item.category || '-';

        let status: 'critical' | 'low' | 'optimal' | 'overstock' = 'optimal';
        if (onHand <= 0) status = 'critical';
        else if (onHand < minStock) status = 'low';
        else if (onHand > minStock * 5) status = 'overstock';

        // Placeholder analytics for turnover and sales coverage as per reference
        const avgSales = Math.random() * 5;
        const daysOfStock = avgSales > 0 ? onHand / avgSales : 0;
        const turnover = (Math.random() * 20).toFixed(1);

        return {
            id: stkCode,
            itemCode: stkCode,
            description: stkDesc,
            category: category,
            onHand: onHand,
            stockValue: onHand * cost,
            daysOfStock: Number(daysOfStock.toFixed(0)),
            turnoverRate: Number(turnover),
            status: status
        };
    }, []);

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {
                recordsperpage: recordsPerPage,
                pageno: page
            };

            if (searchTerm) {
                params.STKDESC = `%${searchTerm}%`;
            }

            if (selectedCategory !== 'all') {
                params.STKCATEGORY1 = selectedCategory;
            }

            // Using direct axios call via httpClient if productService is failing or filtering issues
            const response = await api.products.getAll(params);

            // Handle different array nesting possibilities
            let items = response;
            if (!Array.isArray(items) && (items as any)?.data) {
                items = (items as any).data;
            }
            if (!Array.isArray(items) && (items as any)?.stkmaster) {
                items = (items as any).stkmaster;
            }

            if (Array.isArray(items)) {
                setInventory(items.map(mapApiToInventory));
            } else {
                setInventory([]);
            }
        } catch (err: any) {
            console.error('Failed to fetch inventory:', err);
            setError(err.message || 'Failed to load inventory data');
        } finally {
            setLoading(false);
        }
    }, [page, recordsPerPage, searchTerm, selectedCategory, mapApiToInventory]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInventory();
        }, searchTerm ? 500 : 0);
        return () => clearTimeout(timer);
    }, [fetchInventory, searchTerm, selectedCategory]);

    const kpis = useMemo(() => {
        const totalValue = inventory.reduce((sum, i) => sum + i.stockValue, 0);
        const critical = inventory.filter(i => i.status === 'critical').length;
        const low = inventory.filter(i => i.status === 'low').length;
        const overstock = inventory.filter(i => i.status === 'overstock').length;
        return { totalValue, critical, low, overstock };
    }, [inventory]);

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
            return matchesStatus;
        });
    }, [inventory, selectedStatus]);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] font-sans select-none overflow-hidden">
            {/* HEADER */}
            <header className="px-8 py-3 bg-[#17316c] text-white shrink-0 flex justify-between items-center shadow-md z-30">
                <h2 className="text-2xl font-black uppercase tracking-tight">Inventory Intelligence</h2>
                <button
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-black uppercase rounded shadow-sm transition-all flex items-center gap-2"
                    onClick={onBack}
                >
                    <span>ESC</span> BACK TO MENU
                </button>
            </header>

            {/* KPI STRIP */}
            <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0 bg-white border-b border-slate-200">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl">💰</div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Stock Asset Value</div>
                        <div className="text-xl font-black text-slate-800 tracking-tight">{formatCurrency(kpis.totalValue)}</div>
                    </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 text-xl">⚠️</div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Critical (Stockout)</div>
                        <div className="text-xl font-black text-red-600 tracking-tight">{kpis.critical} SKUs</div>
                    </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 text-xl">⏳</div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Low stock warning</div>
                        <div className="text-xl font-black text-amber-500 tracking-tight">{kpis.low} SKUs</div>
                    </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl">📦</div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Overstock inefficiencies</div>
                        <div className="text-xl font-black text-indigo-600 tracking-tight">{kpis.overstock} SKUs</div>
                    </div>
                </div>
            </div>

            {/* FILTERS */}
            <div className="m-8 mb-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5 shrink-0 z-20">
                <div className="flex-1 relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#17316c]">🔍</span>
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#17316c]/5 focus:border-[#17316c] outline-none text-sm"
                        placeholder="Search items by description or SKU code..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                    />
                </div>

                <select
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 text-xs focus:ring-2 focus:ring-[#17316c]/10 outline-none"
                    value={selectedCategory}
                    onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
                >
                    <option value="all">All Groups</option>
                    {mockCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <select
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 text-xs focus:ring-2 focus:ring-[#17316c]/10 outline-none"
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                >
                    <option value="all">Health: All</option>
                    <option value="critical">⛔ Critical</option>
                    <option value="low">⚠️ Low Stock</option>
                    <option value="optimal">✅ Optimal</option>
                    <option value="overstock">📦 Overstock</option>
                </select>
            </div>

            {/* GRID */}
            <div className="flex-1 mx-8 mb-8 bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col relative grid-container">
                <style>
                    {`
                    .grid-container .dx-datagrid-headers { background-color: #17316c !important; color: white !important; font-weight: bold; }
                    .grid-container .dx-datagrid-headers .dx-header-row > td { color: white !important; padding: 14px 16px !important; font-size: 13px !important; font-weight: 700 !important; border-bottom: none !important; }
                    .grid-container .dx-datagrid-rowsview .dx-row > td { padding: 12px 16px !important; font-size: 14px !important; border-bottom: 1px solid #f1f5f9 !important; color: #1e293b !important; }
                    .health-badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-weight: 900; font-size: 10px; text-transform: uppercase; }
                    `}
                </style>

                <DataGrid
                    ref={gridRef}
                    dataSource={filteredInventory}
                    keyExpr="id"
                    showBorders={false}
                    focusedRowEnabled={true}
                    hoverStateEnabled={true}
                    height="100%"
                    width="100%"
                    columnAutoWidth={true}
                    className="h-full font-sans"
                >
                    <Selection mode="single" />
                    <Scrolling mode="virtual" />
                    <Sorting mode="single" />
                    <Paging enabled={false} />
                    <LoadPanel enabled={loading} />

                    <Column dataField="itemCode" caption="Code" cssClass="font-bold text-[#17316c]" />
                    <Column dataField="description" caption="Description" minWidth={300} />
                    <Column dataField="category" caption="Category" alignment="center" />
                    <Column dataField="onHand" caption="On Hand" alignment="right" format="#,##0" cssClass="font-black" />
                    <Column dataField="stockValue" caption="Value" alignment="right" format={{ type: 'fixedPoint', precision: 2 }} />
                    <Column dataField="daysOfStock" caption="Days Coverage" alignment="right"
                        cellRender={(data: any) => (
                            <span className={data.value <= 0 ? 'text-red-500 font-bold' : 'text-slate-500'}>
                                {data.value}d
                            </span>
                        )}
                    />
                    <Column dataField="turnoverRate" caption="Turnover" alignment="right" format="#,##0.0'%' " />
                    <Column dataField="status" caption="Health" alignment="center"
                        cellRender={(data: any) => {
                            const val = data.value;
                            const colors: any = {
                                critical: 'bg-red-50 text-red-600 border border-red-100',
                                low: 'bg-amber-50 text-amber-600 border border-amber-100',
                                optimal: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
                                overstock: 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                            };
                            return <span className={`health-badge ${colors[val] || colors.optimal}`}>{val}</span>;
                        }}
                    />
                </DataGrid>

                {error && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-4 z-50">
                        <div className="text-red-600 font-black uppercase tracking-widest">{error}</div>
                        <button className="px-6 py-2 bg-[#17316c] text-white rounded-lg font-black text-xs" onClick={fetchInventory}>Retry</button>
                    </div>
                )}
            </div>

            {/* PAGINATION */}
            {!loading && (
                <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Page: <span className="text-primary">{page}</span> | <span className="text-slate-800">{inventory.length} items loaded</span>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-1.5 bg-white border border-slate-200 text-slate-400 font-bold text-[10px] rounded hover:bg-slate-50" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>PREV</button>
                        <button className="px-5 py-1.5 bg-[#17316c] text-white font-bold text-[10px] rounded hover:bg-[#1e40af]" onClick={() => setPage(p => p + 1)} disabled={inventory.length < recordsPerPage}>NEXT</button>
                    </div>
                </div>
            )}
        </div>
    );
};
