import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types/domain.types';
import { api } from '../../api';
import { transformApiProduct } from '../../utils/transformers';
import { enrichProductsWithPrices } from '../../utils/priceUtils';
import { Modal } from '../common/Modal';
import { MOCK_PRODUCTS, USE_MOCK_DATA } from '../../data/mockData';
import { formatCurrency } from '../../utils/formatters';
import DataGrid, { Column, Selection, Scrolling } from 'devextreme-react/data-grid';
import { GridCustomizerModal, GridColumnConfig } from './GridCustomizerModal';
import { SearchInputModal } from './SearchInputModal';

export type ProductSearchMode = 'stockcode' | 'description1' | 'barcode';

const SEARCH_MODE_LABELS: Record<ProductSearchMode, { label: string; key: string }> = {
    stockcode: { label: 'Stock Code', key: 'F2' },
    description1: { label: 'Description', key: 'F3' },
    barcode: { label: 'Barcode', key: 'F4' },
};

const DEFAULT_COLUMNS: GridColumnConfig[] = [
    // Core Identification
    { key: 'rownum', caption: 'Row #', visible: false, width: 60 },
    { key: 'recid', caption: 'Rec ID', visible: false, width: 80 },
    { key: 'itemid', caption: 'Item ID', visible: false, width: 80 },
    { key: 'stockcode', caption: 'Stock Code', visible: true, width: 120 },
    { key: 'barcode', caption: 'Barcode', visible: true, width: 120 },
    { key: 'linkcode', caption: 'Link Code', visible: false, width: 100 },
    { key: 'description1', caption: 'Description 1', visible: true, width: 250 },
    { key: 'description2', caption: 'Description 2', visible: false, width: 200 },
    { key: 'description3', caption: 'Description 3', visible: false, width: 200 },
    { key: 'shortdesc', caption: 'Short Desc', visible: false, width: 150 },
    { key: 'descriptions', caption: 'Descriptions', visible: false, width: 200 },
    { key: 'variant', caption: 'Variant', visible: false, width: 100 },
    { key: 'stylecode', caption: 'Style Code', visible: false, width: 100 },

    // Pricing & Costs
    { key: 'sugsell', caption: 'Selling Price', visible: true, width: 100, dataType: 'currency', alignment: 'right' },
    { key: 'lastcostexcl', caption: 'Last Cost Excl', visible: false, width: 100, dataType: 'currency', alignment: 'right' },
    { key: 'lastcostincl', caption: 'Last Cost Incl', visible: false, width: 100, dataType: 'currency', alignment: 'right' },
    { key: 'avgcostexcl', caption: 'Avg Cost Excl', visible: false, width: 100, dataType: 'currency', alignment: 'right' },
    { key: 'avgcostincl', caption: 'Avg Cost Incl', visible: false, width: 100, dataType: 'currency', alignment: 'right' },
    { key: 'buycostexcl', caption: 'Buy Cost Excl', visible: false, width: 100, dataType: 'currency', alignment: 'right' },
    { key: 'buycostincl', caption: 'Buy Cost Incl', visible: false, width: 100, dataType: 'currency', alignment: 'right' },
    { key: 'rebateavgexcl', caption: 'Rebate Avg Excl', visible: false, width: 120, dataType: 'currency', alignment: 'right' },
    { key: 'rebatelastexcl', caption: 'Rebate Last Excl', visible: false, width: 120, dataType: 'currency', alignment: 'right' },
    { key: 'rebnettavg', caption: 'Reb Nett Avg', visible: false, width: 120, dataType: 'currency', alignment: 'right' },
    { key: 'rebnettlast', caption: 'Reb Nett Last', visible: false, width: 120, dataType: 'currency', alignment: 'right' },
    { key: 'costplusexcl', caption: 'Cost Plus Excl', visible: false, width: 100, dataType: 'currency', alignment: 'right' },
    { key: 'costplusincl', caption: 'Cost Plus Incl', visible: false, width: 100, dataType: 'currency', alignment: 'right' },
    { key: 'basecostexcl', caption: 'Base Cost Excl', visible: false, width: 100, dataType: 'currency', alignment: 'right' },
    { key: 'basecostincl', caption: 'Base Cost Incl', visible: false, width: 100, dataType: 'currency', alignment: 'right' },
    { key: 'branchcostexcl', caption: 'Branch Cost Excl', visible: false, width: 120, dataType: 'currency', alignment: 'right' },
    { key: 'branchcostincl', caption: 'Branch Cost Incl', visible: false, width: 120, dataType: 'currency', alignment: 'right' },
    { key: 'foreignbuycost', caption: 'Foreign Buy Cost', visible: false, width: 120, dataType: 'currency', alignment: 'right' },
    { key: 'foreignccy', caption: 'Foreign CCY', visible: false, width: 80 },
    { key: 'costcode', caption: 'Cost Code', visible: false, width: 100 },
    { key: 'vatcode', caption: 'VAT Code', visible: false, width: 80 },
    { key: 'miscgp', caption: 'Misc GP', visible: false, width: 80, alignment: 'right' },

    // Stock & Inventory
    { key: 'stock', caption: 'Qty On Hand', visible: true, width: 100, alignment: 'right' },
    { key: 'binlocation', caption: 'Bin Location', visible: true, width: 100 },
    { key: 'minqty', caption: 'Min Qty', visible: false, width: 80, alignment: 'right' },
    { key: 'maxqty', caption: 'Max Qty', visible: false, width: 80, alignment: 'right' },
    { key: 'reordertype', caption: 'Reorder Type', visible: false, width: 100 },
    { key: 'averagestk', caption: 'Avg Stock', visible: false, width: 80, alignment: 'right' },
    { key: 'avgweek', caption: 'Avg Week', visible: false, width: 80, alignment: 'right' },
    { key: 'units', caption: 'Units', visible: false, width: 80, alignment: 'right' },
    { key: 'singles', caption: 'Singles', visible: false, width: 80, alignment: 'right' },
    { key: 'packcase', caption: 'Pack/Case', visible: false, width: 80, alignment: 'right' },
    { key: 'casepall', caption: 'Case/Pall', visible: false, width: 80, alignment: 'right' },
    { key: 'packsize', caption: 'Pack Size', visible: false, width: 100 },
    { key: 'packunits', caption: 'Pack Units', visible: false, width: 100, alignment: 'right' },
    { key: 'weight', caption: 'Weight', visible: false, width: 80, alignment: 'right' },
    { key: 'itemlength', caption: 'Length', visible: false, width: 80, alignment: 'right' },
    { key: 'itembreadth', caption: 'Breadth', visible: false, width: 80, alignment: 'right' },
    { key: 'itemheight', caption: 'Height', visible: false, width: 80, alignment: 'right' },
    { key: 'sqmbox', caption: 'Sqm/Box', visible: false, width: 80, alignment: 'right' },

    // Categorization
    { key: 'co', caption: 'Co', visible: false, width: 50 },
    { key: 'branch', caption: 'Branch', visible: false, width: 60 },
    { key: 'deptcode', caption: 'Department', visible: false, width: 100 },
    { key: 'subdept', caption: 'Sub Dept', visible: false, width: 100 },
    { key: 'category1', caption: 'Category 1', visible: false, width: 100 },
    { key: 'category2', caption: 'Category 2', visible: false, width: 100 },
    { key: 'category3', caption: 'Category 3', visible: false, width: 100 },
    { key: 'category4', caption: 'Category 4', visible: false, width: 100 },
    { key: 'stocktype', caption: 'Stock Type', visible: false, width: 80 },
    { key: 'defaultwh', caption: 'Default WH', visible: false, width: 100 },

    // Supplier & Manufacturer
    { key: 'supplier', caption: 'Supplier', visible: false, width: 100 },
    { key: 'suppcode', caption: 'Supp Code', visible: false, width: 100 },
    { key: 'manufacturer', caption: 'Manufacturer', visible: false, width: 120 },
    { key: 'buyer', caption: 'Buyer', visible: false, width: 80 },
    { key: 'hbuyer', caption: 'H Buyer', visible: false, width: 80 },

    // Status & Flags
    { key: 'status', caption: 'Status', visible: false, width: 80 },
    { key: 'saleitem', caption: 'Sale Item', visible: false, width: 80 },
    { key: 'purchaseitem', caption: 'Purchase Item', visible: false, width: 80 },
    { key: 'inventoryitem', caption: 'Inventory Item', visible: false, width: 80 },
    { key: 'serialtrack', caption: 'Serial Track', visible: false, width: 80 },
    { key: 'linkedserial', caption: 'Linked Serial', visible: false, width: 80 },
    { key: 'negativeqty', caption: 'Neg Qty', visible: false, width: 80 },
    { key: 'sellbelowcost', caption: 'Sell Below Cost', visible: false, width: 80 },
    { key: 'changeselling', caption: 'Change Selling', visible: false, width: 80 },
    { key: 'changecost', caption: 'Change Cost', visible: false, width: 80 },
    { key: 'allowadjust', caption: 'Allow Adjust', visible: false, width: 80 },
    { key: 'allowcosting', caption: 'Allow Costing', visible: false, width: 80 },
    { key: 'kit', caption: 'Kit', visible: false, width: 80 },
    { key: 'kitprint', caption: 'Kit Print', visible: false, width: 80 },
    { key: 'competition', caption: 'Competition', visible: false, width: 80 },
    { key: 'virtualpin', caption: 'Virtual Pin', visible: false, width: 80 },
    { key: 'contractitem', caption: 'Contract Item', visible: false, width: 80 },
    { key: 'voucheritem', caption: 'Voucher Item', visible: false, width: 80 },
    { key: 'food', caption: 'Food', visible: false, width: 50 },
    { key: 'kvi', caption: 'KVI', visible: false, width: 50 },
    { key: 'scaleitem', caption: 'Scale Item', visible: false, width: 80 },
    { key: 'scaletype', caption: 'Scale Type', visible: false, width: 80 },
    { key: 'printlabel', caption: 'Print Label', visible: false, width: 80 },

    // Decimals & Scaling
    { key: 'qtydecimal', caption: 'Qty Decimal', visible: false, width: 80, alignment: 'right' },
    { key: 'costdecimal', caption: 'Cost Decimal', visible: false, width: 80, alignment: 'right' },
    { key: 'selldecimal', caption: 'Sell Decimal', visible: false, width: 80, alignment: 'right' },
    { key: 'sqmbox', caption: 'Sqm/Box', visible: false, width: 80, alignment: 'right' },
    { key: 'wtcasestart', caption: 'Wt Case Start', visible: false, width: 80, alignment: 'right' },
    { key: 'wtcaselength', caption: 'Wt Case Len', visible: false, width: 80, alignment: 'right' },
    { key: 'wtcasefactor', caption: 'Wt Case Fac', visible: false, width: 80, alignment: 'right' },

    // Dates & Times
    { key: 'createdate', caption: 'Create Date', visible: false, width: 100, dataType: 'date' },
    { key: 'createtime', caption: 'Create Time', visible: false, width: 80 },
    { key: 'createuser', caption: 'Create User', visible: false, width: 100 },
    { key: 'createmacid', caption: 'Create MacID', visible: false, width: 100 },
    { key: 'dtodate', caption: 'Last Edit Date', visible: false, width: 100, dataType: 'date' },
    { key: 'dtotime', caption: 'Last Edit Time', visible: false, width: 80 },
    { key: 'dtouser', caption: 'Last Edit User', visible: false, width: 100 },
    { key: 'dtomacid', caption: 'Last Edit MacID', visible: false, width: 100 },
    { key: 'lastcounteddate', caption: 'Last Counted', visible: false, width: 100, dataType: 'date' },
    { key: 'lastsaledate', caption: 'Last Sale', visible: false, width: 100, dataType: 'date' },
    { key: 'stocktakedate', caption: 'Stock Take Date', visible: false, width: 100, dataType: 'date' },
    { key: 'leadtimedays', caption: 'Lead Time Days', visible: false, width: 100, alignment: 'right' },

    // Properties
    { key: 'property01', caption: 'Property 01', visible: false, width: 100 },
    { key: 'property02', caption: 'Property 02', visible: false, width: 100 },
    { key: 'property03', caption: 'Property 03', visible: false, width: 100 },
    { key: 'property04', caption: 'Property 04', visible: false, width: 100 },
    { key: 'property05', caption: 'Property 05', visible: false, width: 100 },
    { key: 'property06', caption: 'Property 06', visible: false, width: 100 },
    { key: 'property07', caption: 'Property 07', visible: false, width: 100 },
    { key: 'property08', caption: 'Property 08', visible: false, width: 100 },
    { key: 'property09', caption: 'Property 09', visible: false, width: 100 },
    { key: 'property10', caption: 'Property 10', visible: false, width: 100 },

    // Promotion
    { key: 'promfdate', caption: 'Prom From Date', visible: false, width: 100, dataType: 'date' },
    { key: 'promtdate', caption: 'Prom To Date', visible: false, width: 100, dataType: 'date' },
    { key: 'promftime', caption: 'Prom From Time', visible: false, width: 100 },
    { key: 'promttime', caption: 'Prom To Time', visible: false, width: 100 },
    { key: 'prommaxqty', caption: 'Prom Max Qty', visible: false, width: 100, alignment: 'right' },
    { key: 'promqtysold', caption: 'Prom Qty Sold', visible: false, width: 100, alignment: 'right' },
    { key: 'prommcust', caption: 'Prom M Cust', visible: false, width: 100, alignment: 'right' },
    { key: 'promperm', caption: 'Prom Perm', visible: false, width: 80 },

    // Financial & Control
    { key: 'glsalesacc', caption: 'GL Sales Acc', visible: false, width: 100 },
    { key: 'glexpenseacc', caption: 'GL Expense Acc', visible: false, width: 100 },
    { key: 'customsgroup', caption: 'Customs Group', visible: false, width: 100 },
    { key: 'customsrate', caption: 'Customs Rate', visible: false, width: 100, alignment: 'right' },
    { key: 'purcardprty', caption: 'Pur Card Prty', visible: false, width: 100, alignment: 'right' },
    { key: 'purcardrule', caption: 'Pur Card Rule', visible: false, width: 100 },
    { key: 'frequency', caption: 'Frequency', visible: false, width: 80 },
    { key: 'commtype', caption: 'Comm Type', visible: false, width: 80 },
    { key: 'commvalue', caption: 'Comm Value', visible: false, width: 80, alignment: 'right' },
    { key: 'repcommtype', caption: 'Rep Comm Type', visible: false, width: 80 },
    { key: 'repcommvalue', caption: 'Rep Comm Value', visible: false, width: 80, alignment: 'right' },

    // Manufacturing & Fabric
    { key: 'gramspersqm', caption: 'Grams/Sqm', visible: false, width: 100, alignment: 'right' },
    { key: 'fabricsqm', caption: 'Fabric Sqm', visible: false, width: 100, alignment: 'right' },
    { key: 'fabriccoreweight', caption: 'Fabric Core Wt', visible: false, width: 120, alignment: 'right' },
    { key: 'gramspermeter', caption: 'Grams/Meter', visible: false, width: 100, alignment: 'right' },

    // Misc
    { key: 'version', caption: 'Version', visible: false, width: 100 },
    { key: 'template', caption: 'Template', visible: false, width: 100 },
    { key: 'sctemplate', caption: 'SC Template', visible: false, width: 100 },
    { key: 'tilesize', caption: 'Tile Size', visible: false, width: 80 },
    { key: 'tilegrade', caption: 'Tile Grade', visible: false, width: 80 },
    { key: 'lengthcolor', caption: 'Length Color', visible: false, width: 100, alignment: 'right' },
    { key: 'lengthsize', caption: 'Length Size', visible: false, width: 100, alignment: 'right' },
    { key: 'divertcode', caption: 'Divert Code', visible: false, width: 100 },
    { key: 'dcitem', caption: 'DC Item', visible: false, width: 80 },
    { key: 'tdss', caption: 'TDSS', visible: false, width: 50 },
    { key: 'seasoncode', caption: 'Season Code', visible: false, width: 100 },
    { key: 'ordcase', caption: 'Ord Case', visible: false, width: 80 },
    { key: 'express', caption: 'Express', visible: false, width: 80 },
    { key: 'ignorepallet', caption: 'Ignore Pallet', visible: false, width: 100 },
    { key: 'exclgrvdisc', caption: 'Excl GRV Disc', visible: false, width: 100 },
    { key: 'kitbuildper', caption: 'Kit Build Per', visible: false, width: 100, alignment: 'right' },
    { key: 'bcadjfactorperc', caption: 'BC Adj Fac %', visible: false, width: 100, alignment: 'right' },
    { key: 'bcadjfactorval', caption: 'BC Adj Fac Val', visible: false, width: 100, alignment: 'right' },
    { key: 'bcadjfrom', caption: 'BC Adj From', visible: false, width: 100, dataType: 'date' },
    { key: 'bcadjto', caption: 'BC Adj To', visible: false, width: 100, dataType: 'date' },
    { key: 'bcpriceincr', caption: 'BC Price Incr', visible: false, width: 100 },
    { key: 'ibtno', caption: 'IBT No', visible: false, width: 80 },
    { key: 'ibtdate', caption: 'IBT Date', visible: false, width: 100, dataType: 'date' },
    { key: 'packlink', caption: 'Pack Link', visible: false, width: 100 },
    { key: 'costplusperc', caption: 'Cost Plus %', visible: false, width: 100, alignment: 'right' },
    { key: 'allowtxtp', caption: 'Allow TXTP', visible: false, width: 80 },
    { key: 'excludeloyalty', caption: 'Exclude Loyalty', visible: false, width: 100 },
    { key: 'iswocommercesynced', caption: 'Woo Sync', visible: false, width: 80 },
    { key: 'wocommerceid', caption: 'Woo ID', visible: false, width: 80 },
    { key: 'imageurl', caption: 'Image URL', visible: false, width: 200 },
    { key: 'stockimage', caption: 'Stock Image', visible: false, width: 200 },
    { key: 'kitfunction', caption: 'Kit Function', visible: false, width: 100 },
];

export const ProductSearchModal = ({ isOpen, onClose, onSelectProduct, priceCategory }: {
    isOpen: boolean,
    onClose: () => void,
    onSelectProduct: (p: Product) => void,
    priceCategory?: string
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [focusedRowIndex, setFocusedRowIndex] = useState(0);
    const dataGridRef = useRef<any>(null);
    const [columns, setColumns] = useState<GridColumnConfig[]>(DEFAULT_COLUMNS);
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState<{ x: number, y: number } | null>(null);

    // Filter modes
    const [searchMode, setSearchMode] = useState<ProductSearchMode>('description1');
    const [isSearchInputOpen, setIsSearchInputOpen] = useState(false);
    const [apiSearchTerm, setApiSearchTerm] = useState('');

    // Handle debouncing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to first page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const loadProducts = async () => {
            if (!isOpen) {
                setSearchTerm('');
                setApiSearchTerm('');
                return;
            }

            setLoading(true);
            try {
                // Fetch using search endpoint with pagination
                let items: any[] = [];

                if (USE_MOCK_DATA) {
                    // Client side filter for mock data
                    const effectiveSearch = apiSearchTerm || debouncedSearch;
                    const filtered = MOCK_PRODUCTS.filter((p: any) =>
                        (p.description || p.name || '').toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                        p.id.toLowerCase().includes(effectiveSearch.toLowerCase())
                    );
                    setTotalItems(filtered.length);
                    items = filtered.slice((page - 1) * pageSize, page * pageSize);
                    setProducts(items.map((p: any) => ({
                        ...p,
                        description: p.description || p.name,
                        stockcode: p.id,
                        description1: p.description || p.name,
                        sugsell: p.price
                    })));
                } else {
                    const searchVal = apiSearchTerm || debouncedSearch;
                    const result = await api.products.search(searchVal, {
                        pageno: page,
                        recordsperpage: pageSize,
                        include_stock_image: true,
                        mode: apiSearchTerm ? searchMode : undefined
                    });
                    const processed = result.items.map(transformApiProduct);
                    const enriched = await enrichProductsWithPrices(processed, priceCategory);
                    setProducts(enriched);

                    const serverTotal = result.total || 0;
                    const lastShownIndex = page * pageSize;
                    if (result.items.length === pageSize && serverTotal <= lastShownIndex) {
                        setTotalItems(lastShownIndex + pageSize);
                    } else {
                        setTotalItems(serverTotal || result.items.length);
                    }
                }
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, [isOpen, debouncedSearch, apiSearchTerm, searchMode, page, pageSize]);

    // Reset selection when products change
    useEffect(() => {
        if (products.length > 0) {
            setFocusedRowIndex(0);
        }
    }, [products]);

    // Load saved column configuration
    useEffect(() => {
        const saved = localStorage.getItem('pos_product_grid_cols');
        if (saved) {
            try {
                const savedCols: GridColumnConfig[] = JSON.parse(saved);

                // Check if this is the old schema (missing 'stockcode')
                // If so, we reset to defaults to ensure the new schema is adopted
                if (!savedCols.some(c => c.key === 'stockcode')) {
                    setColumns(DEFAULT_COLUMNS);
                    return;
                }

                // If schema matches, we merge to add any NEW columns that might not be in saved config
                const savedMap = new Map(savedCols.map(col => [col.key, col]));
                const mergedCols = [...savedCols];

                DEFAULT_COLUMNS.forEach(defCol => {
                    if (!savedMap.has(defCol.key)) {
                        mergedCols.push(defCol);
                    }
                });

                setColumns(mergedCols);
            } catch (e) {
                setColumns(DEFAULT_COLUMNS);
            }
        } else {
            setColumns(DEFAULT_COLUMNS);
        }
    }, []);

    const handleSaveColumns = (newColumns: GridColumnConfig[]) => {
        setColumns(newColumns);
        localStorage.setItem('pos_product_grid_cols', JSON.stringify(newColumns));
        setIsCustomizerOpen(false);
    };

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenuPos(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Handle Ctrl+R to restore grid defaults and filter modes
    useEffect(() => {
        if (!isOpen || isCustomizerOpen || isSearchInputOpen) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                setColumns(DEFAULT_COLUMNS);
                localStorage.removeItem('pos_product_grid_cols');
                return;
            }

            // Arrow keys - Navigate grid
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedRowIndex(prev => Math.min(prev + 1, products.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedRowIndex(prev => Math.max(prev - 1, 0));
                return;
            }

            // Enter - Select focused product
            if (e.key === 'Enter') {
                e.preventDefault();
                const selected = products[focusedRowIndex];
                if (selected) onSelectProduct(selected);
                return;
            }

            // F2-F4 - Open search input modal
            const modeMap: Record<string, ProductSearchMode> = {
                'F2': 'stockcode',
                'F3': 'description1',
                'F4': 'barcode',
            };

            if (modeMap[e.key]) {
                e.preventDefault();
                e.stopImmediatePropagation();
                setSearchMode(modeMap[e.key]);
                setIsSearchInputOpen(true);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen, isCustomizerOpen, isSearchInputOpen, products, focusedRowIndex, onSelectProduct]);

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value));
        setPage(1);
    };

    const getPageNumbers = () => {
        const totalPages = Math.ceil(totalItems / pageSize);
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

        const pages: (number | string)[] = [];
        pages.push(1);

        if (page > 4) pages.push('...');

        const start = Math.max(2, page - 2);
        const end = Math.min(totalPages - 1, page + 2);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (page < totalPages - 3) pages.push('...');

        if (totalPages > 1) pages.push(totalPages);

        return pages;
    };

    const handleGridKeyDown = (e: any) => {
        if (e.event.key === 'Enter') {
            e.event.preventDefault(); // Prevent default grid behavior
            const rowIndex = e.component.option('focusedRowIndex');
            if (rowIndex >= 0 && rowIndex < products.length) {
                onSelectProduct(products[rowIndex]);
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Stock Item Search" size="xlarge" bodyClassName="flex flex-col h-full max-h-full overflow-hidden p-0" disableEscapeKey={isCustomizerOpen || isSearchInputOpen}>
            <div className="flex flex-col h-full bg-slate-50 overflow-hidden font-sans">
                <div className="px-6 pt-0 pb-2 space-y-3 bg-white border-b border-slate-100 shadow-sm relative z-10">
                    {/* Search Mode Indicator */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {Object.entries(SEARCH_MODE_LABELS).map(([mode, { label, key }]) => (
                            <button
                                key={mode}
                                onClick={() => { setSearchMode(mode as ProductSearchMode); setIsSearchInputOpen(true); }}
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
                                onClick={() => setApiSearchTerm('')}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            className="w-full pl-11 pr-16 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal outline-none"
                            placeholder="Quick filter results..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    e.preventDefault();
                                    if (searchTerm) setSearchTerm('');
                                    else onClose();
                                }
                            }}
                            autoFocus
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

                <div className="flex-1 overflow-hidden px-0 py-4 relative flex flex-col">
                    <div className="flex-1 bg-white rounded-none border border-slate-100 shadow-xl shadow-black/[0.02] overflow-hidden flex flex-col">
                        <DataGrid
                            ref={dataGridRef}
                            dataSource={products}
                            keyExpr="id"
                            showBorders={false}
                            columnAutoWidth={true}
                            width="100%"
                            focusedRowEnabled={true}
                            autoNavigateToFocusedRow={true}
                            focusedRowIndex={focusedRowIndex}
                            onFocusedRowChanged={(e: any) => setFocusedRowIndex(e.rowIndex)}
                            onKeyDown={handleGridKeyDown}
                            onRowClick={(e: any) => onSelectProduct(e.data)}
                            onRowDblClick={(e: any) => onSelectProduct(e.data)}
                            onContextMenuPreparing={(e: any) => {
                                if (e.row?.rowType === 'data') {
                                    e.event.preventDefault();
                                    setContextMenuPos({ x: e.event.pageX, y: e.event.pageY });
                                }
                            }}
                            className="product-search-grid"
                            height="100%"
                            hoverStateEnabled={true}
                        >
                            <Selection mode="single" />
                            <Scrolling mode="virtual" />

                            {columns.filter(col => col.visible).map(col => (
                                <Column
                                    key={col.key}
                                    dataField={col.key}
                                    caption={col.caption}
                                    width={col.width}
                                    minWidth={col.minWidth}
                                    alignment={col.alignment}
                                    cellRender={(data) => {
                                        if (col.key === 'sugsell') {
                                            return <span className="font-black text-primary">{formatCurrency(data.value)}</span>;
                                        }
                                        if (col.key === 'stockcode') {
                                            return <span className="font-mono font-black text-slate-400">{data.value}</span>;
                                        }
                                        if (col.key === 'description1') {
                                            return <span className="font-bold text-slate-700">{data.value}</span>;
                                        }
                                        if (col.key === 'stock') {
                                            return <span className="font-mono font-bold text-slate-600">{data.value || 0}</span>;
                                        }
                                        if (col.dataType === 'currency') {
                                            return <span>{formatCurrency(data.value)}</span>;
                                        }
                                        if (col.dataType === 'date') {
                                            return <span>{data.value ? new Date(data.value).toLocaleDateString() : ''}</span>;
                                        }
                                        return undefined;
                                    }}
                                />
                            ))}
                        </DataGrid>
                        {products.length === 0 && !loading && (
                            <div className="absolute inset-x-0 top-32 flex flex-col items-center gap-4 text-slate-300 pointer-events-none">
                                <span className="text-6xl opacity-20">🔎</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">No products found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination Controls - Fixed at bottom */}
                <div className="shrink-0 p-6 bg-white border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-primary">{(page - 1) * pageSize + 1}-{Math.min(totalItems, page * pageSize)}</span> of <span className="text-primary">{totalItems}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <label htmlFor="pageSize" className="text-[10px] font-black text-[#17316c] uppercase tracking-widest">Rows:</label>
                            <select
                                id="pageSize"
                                value={pageSize}
                                onChange={handlePageSizeChange}
                                className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg focus:ring-primary focus:border-primary p-1 outline-none transition-all"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all active:scale-95 ${page === 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            onClick={() => setPage(1)}
                            disabled={page === 1 || loading}
                            title="First Page"
                        >
                            &laquo;
                        </button>
                        <button
                            className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all active:scale-95 ${page === 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            title="Previous Page"
                        >
                            &larr;
                        </button>

                        <div className="flex gap-1">
                            {getPageNumbers().map((pageNum, idx) => (
                                pageNum === '...' ? (
                                    <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-300 font-bold">...</span>
                                ) : (
                                    <button
                                        key={`page-${pageNum}`}
                                        className={`w-9 h-9 rounded-xl font-black text-xs transition-all active:scale-95 ${page === pageNum ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                        onClick={() => setPage(pageNum as number)}
                                        disabled={loading}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            ))}
                        </div>

                        <button
                            className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all active:scale-95 ${page >= Math.ceil(totalItems / pageSize) && (totalItems % pageSize !== 0 || totalItems === 0) ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            onClick={() => setPage(p => p + 1)}
                            disabled={(page >= Math.ceil(totalItems / pageSize) && (totalItems % pageSize !== 0 || totalItems === 0)) || loading}
                            title="Next Page"
                        >
                            &rarr;
                        </button>
                        <button
                            className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all active:scale-95 ${page >= Math.ceil(totalItems / pageSize) && (totalItems % pageSize !== 0 || totalItems === 0) ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            onClick={() => setPage(Math.ceil(totalItems / pageSize))}
                            disabled={(page >= Math.ceil(totalItems / pageSize) && (totalItems % pageSize !== 0 || totalItems === 0)) || loading}
                            title="Last Page"
                        >
                            &raquo;
                        </button>
                    </div>
                </div>
            </div>

            {/* Context Menu */}
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

            <GridCustomizerModal
                isOpen={isCustomizerOpen}
                onClose={() => setIsCustomizerOpen(false)}
                initialColumns={columns}
                onSave={handleSaveColumns}
            />

            <SearchInputModal
                isOpen={isSearchInputOpen}
                onClose={() => setIsSearchInputOpen(false)}
                onSearch={(val) => { setApiSearchTerm(val); setPage(1); }}
                searchLabel={SEARCH_MODE_LABELS[searchMode].label}
                searchKey={SEARCH_MODE_LABELS[searchMode].key}
            />
        </Modal>
    );
};
