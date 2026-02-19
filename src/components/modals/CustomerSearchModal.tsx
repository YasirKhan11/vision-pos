import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Customer } from '../../types/domain.types';
import DataGrid, { Column, Selection, Scrolling } from 'devextreme-react/data-grid';
import { GridCustomizerModal, GridColumnConfig } from './GridCustomizerModal';
import { SearchInputModal } from './SearchInputModal';
import { formatCurrency } from '../../utils/formatters';

export type SearchMode =
    | 'account'      // F2
    | 'name'         // F3
    | 'tradename'    // F4
    | 'telephone'    // F5
    | 'telephone2'   // F6
    | 'idno'         // F7
    | 'quoteno'      // F8
    | 'vehiclereg'   // F9
    | 'vehiclechasis' // F10
    | 'email'        // F11
    | 'appcode';     // F12

interface CustomerSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCustomer: (c: Customer) => void;
    customers: Customer[];
    loading?: boolean;
    onSearch?: (searchTerm: string, mode: SearchMode) => void;
    hideFilters?: boolean;
}

const DEFAULT_COLUMNS: GridColumnConfig[] = [
    // Core Identity
    { key: 'id', caption: 'Account', visible: true, width: 100, dataType: 'string' },
    { key: 'name', caption: 'Debtors Name', visible: true, minWidth: 250, dataType: 'string' },
    { key: 'tradename', caption: 'Trade Name', visible: false, width: 200, dataType: 'string' },
    { key: 'debtortype', caption: 'Type', visible: false, width: 80, dataType: 'string' },

    // Contact Info
    { key: 'contactPerson', caption: 'Contact Person', visible: true, width: 150, dataType: 'string' },
    { key: 'telephone', caption: 'Telephone', visible: true, width: 120, dataType: 'string' },
    { key: 'telephone2', caption: 'Telephone 2', visible: false, width: 120, dataType: 'string' },
    { key: 'cellphone', caption: 'Cellphone', visible: true, width: 120, dataType: 'string' },
    { key: 'fax', caption: 'Fax', visible: false, width: 120, dataType: 'string' },
    { key: 'email', caption: 'Email', visible: false, width: 200, dataType: 'string' },
    { key: 'website', caption: 'Website', visible: false, width: 200, dataType: 'string' },

    // Financials
    { key: 'balance', caption: 'Balance', visible: true, width: 120, dataType: 'currency', alignment: 'right' },
    { key: 'creditlimit', caption: 'Credit Limit', visible: false, width: 120, dataType: 'currency', alignment: 'right' },
    { key: 'crdownlim', caption: 'Credit Own Limit', visible: false, width: 120, dataType: 'currency', alignment: 'right' },
    { key: 'terms', caption: 'Terms', visible: false, width: 80, dataType: 'string' },
    { key: 'pricecat', caption: 'Price Category', visible: false, width: 100, dataType: 'string' },
    { key: 'vatnumber', caption: 'VAT Number', visible: false, width: 120, dataType: 'string' },
    { key: 'currency', caption: 'Currency', visible: false, width: 80, dataType: 'string' },

    // Addresses
    { key: 'busaddress1', caption: 'Bus Address 1', visible: false, width: 200, dataType: 'string' },
    { key: 'busaddress2', caption: 'Bus Address 2', visible: false, width: 200, dataType: 'string' },
    { key: 'busaddress3', caption: 'Bus Address 3', visible: false, width: 200, dataType: 'string' },
    { key: 'busaddress4', caption: 'City', visible: false, width: 150, dataType: 'string' },
    { key: 'buspostcode', caption: 'Post Code', visible: false, width: 80, dataType: 'string' },

    { key: 'postaddress1', caption: 'Postal Addr 1', visible: false, width: 200, dataType: 'string' },
    { key: 'postaddress2', caption: 'Postal Addr 2', visible: false, width: 200, dataType: 'string' },
    { key: 'postaddress3', caption: 'Postal Addr 3', visible: false, width: 200, dataType: 'string' },
    { key: 'postaddress4', caption: 'Postal City', visible: false, width: 150, dataType: 'string' },
    { key: 'postcode', caption: 'Postal Code', visible: false, width: 80, dataType: 'string' },

    // Additional Fields
    { key: 'co', caption: 'Company', visible: false, width: 60 },
    { key: 'branch', caption: 'Branch', visible: false, width: 60 },
    { key: 'accounttype', caption: 'Account Type', visible: false, width: 100 },
    { key: 'saletype', caption: 'Sale Type', visible: false, width: 80 },
    { key: 'vatindicator', caption: 'VAT Ind', visible: false, width: 60 },
    { key: 'status', caption: 'Status', visible: false, width: 60 },
    { key: 'salesrep', caption: 'Sales Rep', visible: false, width: 100 },
    { key: 'area', caption: 'Area', visible: false, width: 100 },
    { key: 'region', caption: 'Region', visible: false, width: 100 },
    { key: 'route', caption: 'Route', visible: false, width: 100 },
    { key: 'category', caption: 'Category', visible: false, width: 100 },
    { key: 'groupcode', caption: 'Group Code', visible: false, width: 100 },
    { key: 'idno', caption: 'ID Number', visible: false, width: 120 },
    { key: 'regno', caption: 'Reg Number', visible: false, width: 120 },

    // Dates & Systems
    { key: 'createdate', caption: 'Created Date', visible: false, width: 100, dataType: 'date' },
    { key: 'dtodate', caption: 'DTO Date', visible: false, width: 100, dataType: 'date' },
    { key: 'dtouser', caption: 'DTO User', visible: false, width: 100 },
    { key: 'version', caption: 'Version', visible: false, width: 80 },
    { key: 'lastprice', caption: 'Last Price', visible: false, width: 80 },
    { key: 'allowpromo', caption: 'Allow Promo', visible: false, width: 80 },
    { key: 'loyaltyperc', caption: 'Loyalty %', visible: false, width: 80, dataType: 'number' },
    { key: 'withdrawlimit', caption: 'Withdraw Limit', visible: false, width: 100, dataType: 'currency' }
];

const SEARCH_MODE_LABELS: Record<SearchMode, { label: string; key: string }> = {
    account: { label: 'Account', key: 'F2' },
    name: { label: 'Name', key: 'F3' },
    tradename: { label: 'Generic Name', key: 'F4' },
    telephone: { label: 'Telephone #1', key: 'F5' },
    telephone2: { label: 'Telephone #2', key: 'F6' },
    idno: { label: 'I.D Number', key: 'F7' },
    quoteno: { label: 'Quote_Order No', key: 'F8' },
    vehiclereg: { label: 'Vehicle Reg No', key: 'F9' },
    vehiclechasis: { label: 'Vehicle Chasis No', key: 'F10' },
    email: { label: 'Email Address', key: 'F11' },
    appcode: { label: 'App Code', key: 'F12' },
};

export const CustomerSearchModal = ({ isOpen, onClose, onSelectCustomer, customers, loading, onSearch, hideFilters = false }: CustomerSearchModalProps) => {
    const [localSearchTerm, setLocalSearchTerm] = useState(''); // For client-side filtering
    const [apiSearchTerm, setApiSearchTerm] = useState(''); // For API search results
    const [searchMode, setSearchMode] = useState<SearchMode>('name');
    const [isSearchInputOpen, setIsSearchInputOpen] = useState(false);
    const [focusedRowIndex, setFocusedRowIndex] = useState(0);
    const dataGridRef = useRef<any>(null);
    const [columns, setColumns] = useState<GridColumnConfig[]>(DEFAULT_COLUMNS);
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState<{ x: number, y: number } | null>(null);

    // Load columns from local storage on mount and merge with defaults
    useEffect(() => {
        const saved = localStorage.getItem('pos_customer_grid_cols');
        if (saved) {
            try {
                const parsed: GridColumnConfig[] = JSON.parse(saved);

                if (Array.isArray(parsed) && parsed.length > 0) {
                    // 1. Create a map of current default columns for quick lookup of "canonical" definition
                    const defaultMap = new Map(DEFAULT_COLUMNS.map(c => [c.key, c]));

                    // 2. Process saved columns: keep existing, update defs, preserve prefs
                    const merged = parsed
                        .filter(c => defaultMap.has(c.key))
                        .map(savedCol => {
                            const def = defaultMap.get(savedCol.key)!;
                            return {
                                ...def,              // Take latest definition
                                visible: savedCol.visible, // Keep user's visibility
                                width: savedCol.width || def.width // Keep user's width
                            };
                        });

                    // 3. Find any NEW columns in defaults that aren't in saved list
                    const savedKeys = new Set(parsed.map(p => p.key));
                    const newColumns = DEFAULT_COLUMNS.filter(c => !savedKeys.has(c.key));

                    // 4. Combine
                    setColumns([...merged, ...newColumns]);
                    return;
                }
            } catch (e) {
                console.error("Failed to load grid columns", e);
            }
        }
        setColumns(DEFAULT_COLUMNS);
    }, []);

    // Filter customers based on local search term (client-side)
    const filteredCustomers = customers.filter(c => {
        if (!localSearchTerm) return true;
        const term = localSearchTerm.toLowerCase();
        return (
            c.id?.toLowerCase().includes(term) ||
            c.name?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.telephone?.toLowerCase().includes(term) || // Changed from 'phone' to 'telephone'
            c.contactPerson?.toLowerCase().includes(term)
        );
    });

    // Reset focused row when filtered results change
    useEffect(() => {
        setFocusedRowIndex(0);
    }, [filteredCustomers.length]);

    // Reset focused row when customers data changes (after API load)
    useEffect(() => {
        setFocusedRowIndex(0);
    }, [customers]);

    // Reset focus to top when modal opens
    useEffect(() => {
        if (isOpen && filteredCustomers.length > 0) {
            setFocusedRowIndex(0);
            setLocalSearchTerm('');
            setContextMenuPos(null);
        }
    }, [isOpen]);

    // Imperative scrolling when focusedRowIndex changes via keyboard
    useEffect(() => {
        if (dataGridRef.current && filteredCustomers.length > 0) {
            const instance = dataGridRef.current.instance;
            // Small timeout to ensure grid has rendered the row
            setTimeout(() => {
                if (instance && typeof instance.navigateToRow === 'function') {
                    instance.navigateToRow(focusedRowIndex);
                }

                if (instance && typeof instance.getScrollable === 'function') {
                    const scrollable = instance.getScrollable();
                    if (scrollable && typeof scrollable.scrollToElement === 'function') {
                        scrollable.scrollToElement(instance.getRowElement(focusedRowIndex));
                    }
                }
            }, 10);
        }
    }, [focusedRowIndex, filteredCustomers]);

    const handleKeyDown = (e: any) => {
        if (e.event.key === 'Enter') {
            const focusedRowIndex = e.component.option('focusedRowIndex');
            if (focusedRowIndex !== -1) {
                const rowData = e.component.getVisibleRows()[focusedRowIndex].data;
                if (rowData) {
                    onSelectCustomer(rowData);
                }
            }
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
    };

    const handleSaveColumns = (newCols: GridColumnConfig[]) => {
        setColumns(newCols);
        localStorage.setItem('pos_customer_grid_cols', JSON.stringify(newCols));
        setIsCustomizerOpen(false);
    };

    // Close context menu on click anywhere else
    useEffect(() => {
        const handleClick = () => setContextMenuPos(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Handle search mode switching (F2-F12) and grid restore (Ctrl+R)
    useEffect(() => {
        if (!isOpen || isCustomizerOpen || isSearchInputOpen) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ctrl+R - Restore grid defaults
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                setColumns(DEFAULT_COLUMNS);
                localStorage.removeItem('pos_customer_grid_cols');
                return;
            }

            // Arrow keys - Navigate grid (works globally, not just in search input)
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedRowIndex(prev => Math.min(prev + 1, filteredCustomers.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedRowIndex(prev => Math.max(prev - 1, 0));
                return;
            }

            // Enter - Select focused customer (only when no child modals are open)
            if (e.key === 'Enter') {
                e.preventDefault();
                const selected = filteredCustomers[focusedRowIndex];
                if (selected) onSelectCustomer(selected);
                return;
            }

            // F2-F12 - Open search input modal
            const modeMap: Record<string, SearchMode> = {
                'F2': 'account',
                'F3': 'name',
                'F4': 'tradename',
                'F5': 'telephone',
                'F6': 'telephone2',
                'F7': 'idno',
                'F8': 'quoteno',
                'F9': 'vehiclereg',
                'F10': 'vehiclechasis',
                'F11': 'email',
                'F12': 'appcode',
            };

            if (modeMap[e.key]) {
                e.preventDefault();
                setSearchMode(modeMap[e.key]);
                setIsSearchInputOpen(true);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen, isCustomizerOpen, isSearchInputOpen, filteredCustomers, focusedRowIndex, onSelectCustomer]);

    const handleSearchSubmit = (value: string) => {
        setApiSearchTerm(value);
        setLocalSearchTerm(''); // Clear local search when using API search
        if (onSearch) {
            onSearch(value, searchMode);
        }
    };

    const handleSearchModeClick = (mode: SearchMode) => {
        setSearchMode(mode);
        setIsSearchInputOpen(true);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Browse / Select a Debtor" size="xlarge" bodyClassName="flex flex-col h-full max-h-full overflow-hidden p-0" disableEscapeKey={isCustomizerOpen || isSearchInputOpen}>
                <div className="px-6 pt-0 pb-2 space-y-3">
                    {/* Search Mode Indicator */}
                    {!hideFilters && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {Object.entries(SEARCH_MODE_LABELS).map(([mode, { label, key }]) => (
                                <button
                                    key={mode}
                                    onClick={() => handleSearchModeClick(mode as SearchMode)}
                                    className={`px-5 py-3 rounded-lg text-base font-bold transition-all ${searchMode === mode && apiSearchTerm
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    <kbd className="text-xs opacity-60 mr-2">{key}</kbd>
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Active API Search Display */}
                    {apiSearchTerm && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-green-600 text-xl">✓</span>
                                <div>
                                    <div className="text-xs font-black text-green-600 uppercase tracking-widest">Active API Search</div>
                                    <div className="text-sm font-bold text-slate-700">
                                        {SEARCH_MODE_LABELS[searchMode].label}: <span className="text-primary">{apiSearchTerm}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setApiSearchTerm('');
                                    if (onSearch) onSearch('', searchMode);
                                }}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {/* Main Search Input (Client-side filtering) */}
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            className="w-full pl-11 pr-16 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal outline-none"
                            placeholder="Quick filter by account or name..."
                            value={localSearchTerm}
                            onChange={(e) => setLocalSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                // Only handle Escape in the input (other keys handled globally)
                                if (e.key === 'Escape') {
                                    e.preventDefault();
                                    if (localSearchTerm) {
                                        setLocalSearchTerm('');
                                    } else {
                                        onClose();
                                    }
                                }
                            }}
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
                            ) : (
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ready</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col px-6 pb-6" onContextMenu={handleContextMenu}>
                    <div className="flex-1 min-h-0 border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                        <DataGrid
                            ref={dataGridRef}
                            dataSource={filteredCustomers}
                            keyExpr="id"
                            showBorders={false}
                            columnAutoWidth={true}
                            width="100%"
                            focusedRowEnabled={true}
                            autoNavigateToFocusedRow={true}
                            focusedRowIndex={focusedRowIndex}
                            onFocusedRowChanged={(e: any) => setFocusedRowIndex(e.rowIndex)}
                            onKeyDown={handleKeyDown}
                            onRowClick={(e: any) => onSelectCustomer(e.data)}
                            onRowDblClick={(e: any) => onSelectCustomer(e.data)}
                            className="customer-search-grid"
                            height="100%"
                            hoverStateEnabled={true}
                        >
                            <Selection mode="single" />
                            <Scrolling mode="virtual" />

                            {columns.filter(c => c.visible).map(col => (
                                <Column
                                    key={col.key}
                                    dataField={col.key}
                                    caption={col.caption}
                                    width={col.width}
                                    minWidth={col.minWidth}
                                    alignment={col.alignment}
                                    cellRender={
                                        col.dataType === 'currency'
                                            ? (data) => <span className="font-mono font-bold text-slate-700">{formatCurrency(data.value || 0)}</span>
                                            : col.key === 'id'
                                                ? (data) => <span className="font-mono font-bold text-primary">{data.value}</span>
                                                : undefined
                                    }
                                />
                            ))}
                        </DataGrid>
                    </div>
                </div>

                {/* Context Menu Label */}
                {contextMenuPos && (
                    <div
                        className="fixed z-[100] bg-white border border-slate-200 shadow-xl rounded-xl py-1 animate-in fade-in zoom-in duration-100"
                        style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
                        onClick={(e) => { e.stopPropagation(); setIsCustomizerOpen(true); setContextMenuPos(null); }}
                    >
                        <button className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <span className="text-primary">⚙️</span> Customise grid
                        </button>
                    </div>
                )}
            </Modal>

            <GridCustomizerModal
                isOpen={isCustomizerOpen}
                onClose={() => setIsCustomizerOpen(false)}
                initialColumns={columns}
                onSave={handleSaveColumns}
            />

            <SearchInputModal
                isOpen={isSearchInputOpen}
                onClose={() => setIsSearchInputOpen(false)}
                onSearch={handleSearchSubmit}
                searchLabel={SEARCH_MODE_LABELS[searchMode].label}
                searchKey={SEARCH_MODE_LABELS[searchMode].key}
            />
        </>
    );
};
