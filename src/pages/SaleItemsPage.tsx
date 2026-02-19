import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api';
import { Product, SaleState, CartItem, Payment, WhatsAppTemplate, Customer } from '../types/domain.types';
import { VAT_RATE, VAT_INDICATOR_OPTIONS, MOCK_PARTS, MOCK_PRODUCTS, WHATSAPP_TEMPLATES, USE_MOCK_DATA } from '../data/mockData';
import { formatCurrency } from '../utils/formatters';
import { calculateLineDiscount } from '../utils/calculations';
import { useHotkeys } from '../hooks/useHotkeys';
import { ProductSearchModal } from '../components/modals/ProductSearchModal';
import { PartsFinderModal } from '../components/modals/PartsFinderModal';
import { TenderModal } from '../components/modals/TenderModal';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { ProductDetailModal } from '../components/modals/ProductDetailModal';
import { ImageViewerModal } from '../components/common/ImageViewerModal';
import { WhatsAppSendModal } from '../components/retail/WhatsAppSendModal';
import { CustomerInsightsPanel } from '../components/retail/CustomerInsightsPanel';
import { LoyaltyPointsDisplay } from '../components/retail/LoyaltyPointsDisplay';
import { FrequentlyBoughtTogether } from '../components/retail/FrequentlyBoughtTogether';
import { WhatsAppQuickActions } from '../components/retail/WhatsAppQuickActions';
import { GridCustomizerModal, GridColumnConfig } from '../components/modals/GridCustomizerModal';
import { InvoiceItemsImportModal } from '../components/modals/InvoiceItemsImportModal';
import { transformApiProduct } from '../utils/transformers';
import { enrichProductsWithPrices } from '../utils/priceUtils';

// DevExtreme Imports
import DataGrid, {
    Column,
    Editing,
    Selection,
    Scrolling,
    Lookup,
    Summary,
    TotalItem,
    ValueFormat
} from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';
import { confirm } from 'devextreme/ui/dialog';


// Types (if not in domain.types)
// import { CartItem } from ...

export const SaleItemsPage = ({ sale, setSale, onBack, onComplete }: { sale: SaleState, setSale: (s: SaleState) => void, onBack: () => void, onComplete: () => void }) => {
    const { items, customer } = sale;
    const [modals, setModals] = useState({ product: false, partsFinder: false, tender: false, confirm: false, invoiceImport: false });
    const [detailProduct, setDetailProduct] = useState<Product | null>(null);
    const [imageViewerProduct, setImageViewerProduct] = useState<Product | null>(null);
    const [whatsAppModal, setWhatsAppModal] = useState<{ isOpen: boolean; template: WhatsAppTemplate | null }>({ isOpen: false, template: null });

    // Entry row state
    const [entryRow, setEntryRow] = useState<{ stockCode: string; description: string; qty: string; price: string; discount: string; discountType: string; productId?: string; originalProduct?: Product | null }>({ stockCode: '', description: '', qty: '1', price: '', discount: '0', discountType: 'P', originalProduct: null });
    const [itemScanCode, setItemScanCode] = useState('');
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [lastAction, setLastAction] = useState<string | null>(null);
    const [docNumber, setDocNumber] = useState('');
    const [orderSaving, setOrderSaving] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);

    // Suggestions state
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
    const lastInvalidPrice = useRef<number | null>(null);

    // Refs
    const entryRowRef = useRef<HTMLDivElement>(null);
    const stockCodeInputRef = useRef<HTMLInputElement>(null);
    const itemScanInputRef = useRef<HTMLInputElement>(null);
    const suggestionsListRef = useRef<HTMLDivElement>(null);
    const skipNextSearchRef = useRef(false);

    // Products (local state for search)
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [hasTriggeredImport, setHasTriggeredImport] = useState(false);

    // Load 500 products on mount for local search
    useEffect(() => {
        const loadInitialProducts = async () => {
            if (!USE_MOCK_DATA) {
                try {
                    const result = await api.products.getAll({
                        pageno: 1,
                        recordsperpage: 500
                    });
                    const processed = result.map(transformApiProduct);
                    const enriched = await enrichProductsWithPrices(processed, customer?.priceCategory);
                    setProducts(enriched);
                } catch (error) {
                    console.error('Failed to load initial products:', error);
                }
            }
        };

        loadInitialProducts();
    }, []);

    // Debounced search for stock code suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (skipNextSearchRef.current) {
                skipNextSearchRef.current = false;
                return;
            }

            const code = entryRow.stockCode.trim();
            if (code.length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            setIsSearching(true);
            try {
                // Step 1: Search locally first
                const localMatches = products.filter(p =>
                    p.id.toLowerCase().includes(code.toLowerCase()) ||
                    p.description.toLowerCase().includes(code.toLowerCase())
                ).slice(0, 10);

                if (localMatches.length > 0) {
                    setSuggestions(localMatches);
                    setShowSuggestions(true);
                    setIsSearching(false);
                    return; // Don't make API call if we have local matches
                }

                // Step 2: If no local matches, search via API
                if (!USE_MOCK_DATA) {
                    const result = await api.products.getAll({
                        stockcode: `like ${code}`,
                        pageno: 1,
                        recordsperpage: 10
                    } as any);
                    const processed = result.map(transformApiProduct);
                    const enriched = await enrichProductsWithPrices(processed, customer?.priceCategory);
                    setSuggestions(enriched);
                    setShowSuggestions(enriched.length > 0);
                } else {
                    // For mock data, we already searched above
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
                setSuggestions([]);
                setShowSuggestions(false);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [entryRow.stockCode, products]);

    // Auto-select first item if none active
    useEffect(() => {
        if (showSuggestions && focusedSuggestionIndex >= 0 && suggestionsListRef.current) {
            const container = suggestionsListRef.current;
            const item = container.children[focusedSuggestionIndex] as HTMLElement;
            if (item) {
                const containerRect = container.getBoundingClientRect();
                const itemRect = item.getBoundingClientRect();

                if (itemRect.bottom > containerRect.bottom) {
                    item.scrollIntoView({ block: 'end', behavior: 'smooth' });
                } else if (itemRect.top < containerRect.top) {
                    item.scrollIntoView({ block: 'start', behavior: 'smooth' });
                }
            }
        }
    }, [focusedSuggestionIndex, showSuggestions]);

    useEffect(() => {
        if (items.length > 0 && activeItemId === null) {
            setActiveItemId(items[0].id);
        }
    }, [items, activeItemId]);

    // Load products from API (generic getAll if beneficial for lookup, though usually we search on demand)
    useEffect(() => {
        if (!USE_MOCK_DATA && products.length === MOCK_PRODUCTS.length) {
            // In a real app we might not load ALL products here, but for this refactor preserving behavior
            // If original loaded all, we do too. But ProductSearchModal loads its own.
            // We'll keep local products as MOCK_PRODUCTS or empty if real? 
            // The original code used MOCK_PRODUCTS for lookupByStockCode in entry row if not found via API?
            // Actually, lookup functions used `products` state.
        }
    }, []);

    // Auto-trigger import modal when landing on page with a linked invoice
    useEffect(() => {
        if (!hasTriggeredImport && items.length === 0 && sale.headerDetails.originalInvoiceNo && !sale.isUnallocated) {
            setModals(m => ({ ...m, invoiceImport: true }));
            setHasTriggeredImport(true);
        }
    }, [hasTriggeredImport, items.length, sale.headerDetails.originalInvoiceNo, sale.isUnallocated]);


    const updateItems = (newItems: CartItem[]) => {
        setSale({ ...sale, items: newItems });
    };

    // Helper to validate if an item exists on the original invoice for returns
    const getOriginalInvoiceItem = (stockCode: string) => {
        if (!sale.originalInvoiceItems || sale.originalInvoiceItems.length === 0) return null;
        return sale.originalInvoiceItems.find(item =>
            item.stockcode?.toLowerCase() === stockCode?.toLowerCase()
        );
    };

    const addProductToCart = (product: Product, quantity: number = 1) => {
        const isReturn = sale.type === 'return' || sale.type === 'account-return';
        let finalPrice = product.price;

        if (isReturn && sale.originalInvoiceItems && !sale.isUnallocated) {
            const originalItem = getOriginalInvoiceItem(product.id);
            if (!originalItem) {
                notify({
                    message: `ITEM NOT FOUND ON INVOICE: ${product.id} does not exist in the original sale record.`,
                    type: "error",
                    displayTime: 5000,
                    position: { at: "top center", my: "top center", offset: "0 100" }
                });
                return; // BLOCK ADDITION
            } else {
                // Auto-set the original price
                finalPrice = originalItem.price;

                // Enforce quantity limit
                const originalQty = Math.abs(originalItem.quantity || 0);
                const currentQty = items
                    .filter(i => i.productId === product.id)
                    .reduce((acc, i) => acc + Math.abs(i.quantity), 0);

                if (currentQty + Math.abs(quantity) > originalQty) {
                    notify({
                        message: `QUANTITY EXCEEDED: You've already added ${currentQty} units. Maximum allowed for ${product.id} is ${originalQty}.`,
                        type: "error",
                        displayTime: 5000,
                        position: { at: "top center", my: "top center", offset: "0 100" }
                    });
                    return;
                }
            }
        }

        // Consolidation Logic: Check for existing item with same ID, Price, and Discount
        const existingItemIndex = items.findIndex(i =>
            i.productId === product.id &&
            i.price === finalPrice &&
            i.discount === 0 && // Standard additions have 0 discount
            i.discountType === 'P'
        );

        if (existingItemIndex >= 0) {
            const newItems = [...items];
            newItems[existingItemIndex].quantity += quantity;
            updateItems(newItems);
            setActiveItemId(newItems[existingItemIndex].id);
        } else {
            const newItem: CartItem = {
                ...(product as any),
                id: Date.now().toString(),
                productId: product.id,
                description: product.description,
                quantity: quantity,
                price: finalPrice,
                discount: 0,
                discountType: 'P',
                originalProduct: product
            };
            updateItems([...items, newItem]);
            setActiveItemId(newItem.id);
        }
    };

    const addManualItemToCart = () => {
        if (!entryRow.description && !entryRow.stockCode) return;

        const isReturn = sale.type === 'return' || sale.type === 'account-return';
        let price = parseFloat(entryRow.price) || 0;

        if (isReturn && sale.originalInvoiceItems && entryRow.stockCode && !sale.isUnallocated) {
            const originalItem = getOriginalInvoiceItem(entryRow.stockCode);
            if (!originalItem) {
                notify({
                    message: `ITEM NOT ON INVOICE: ${entryRow.stockCode} was not part of original invoice ${sale.headerDetails.originalInvoiceNo}`,
                    type: "error"
                });
                return; // BLOCK ADDITION
            } else {
                if (price === 0) {
                    // Fallback to original price if current price is unset
                    price = originalItem.price;
                }

                // Enforce quantity limit
                const qtyToAdd = parseFloat(entryRow.qty) || 1;
                const originalQty = Math.abs(originalItem.quantity || 0);
                const currentQty = items
                    .filter(i => i.productId === entryRow.stockCode)
                    .reduce((acc, i) => acc + Math.abs(i.quantity), 0);

                if (currentQty + Math.abs(qtyToAdd) > originalQty) {
                    notify({
                        message: `QUANTITY EXCEEDED: You've already added ${currentQty} units. Maximum allowed for ${entryRow.stockCode} is ${originalQty}.`,
                        type: "error"
                    });
                    return;
                }
            }
        }

        // Floor Price Validation (Only for EXCL items)
        const isExcl = entryRow.originalProduct?.vatCode === 'Z';
        if (isExcl && entryRow.originalProduct?.detailedPrice?.excl !== undefined) {
            if (price < entryRow.originalProduct.detailedPrice.excl) {
                notify({
                    message: "Cannot Sell Below Cost Price",
                    type: "error",
                    displayTime: 3000,
                    position: { at: "top center", my: "top center", offset: "0 50" }
                });
                return;
            }
        }

        const qtyToAdd = parseFloat(entryRow.qty) || 1;
        const discountVal = parseFloat(entryRow.discount) || 0;
        const discType = entryRow.discountType as 'P' | 'V';

        // Consolidation Logic: Check for existing item with same ID, Price, and Discount
        const existingItemIndex = items.findIndex(i =>
            i.productId === entryRow.stockCode &&
            i.price === price &&
            i.discount === discountVal &&
            i.discountType === discType
        );

        if (existingItemIndex >= 0) {
            const newItems = [...items];
            newItems[existingItemIndex].quantity += qtyToAdd;
            updateItems(newItems);
            setActiveItemId(newItems[existingItemIndex].id);
        } else {
            const newItem: CartItem = {
                id: Date.now().toString(),
                productId: entryRow.stockCode,
                description: entryRow.description || 'Sundry Item',
                quantity: qtyToAdd,
                price: price,
                discount: discountVal,
                discountType: discType,
                originalProduct: entryRow.originalProduct || undefined
            };
            updateItems([...items, newItem]);
            setActiveItemId(newItem.id);
        }

        setEntryRow({ stockCode: '', description: '', qty: '1', price: '', discount: '0', discountType: 'P', originalProduct: null });
        setActiveItemId(existingItemIndex >= 0 ? items[existingItemIndex].id : items[items.length - 1]?.id || '');

        // Refocus start
        setTimeout(() => stockCodeInputRef.current?.focus(), 10);
    };

    // Lookup helpers
    const lookupByStockCode = (code: string) => {
        return products.find(p => p.id.toLowerCase() === code.toLowerCase()) ||
            MOCK_PARTS.find(p => p.id.toLowerCase() === code.toLowerCase());
    };

    const lookupByDescription = (desc: string) => {
        return products.find(p => p.description.toLowerCase() === desc.toLowerCase()) ||
            MOCK_PARTS.find(p => p.description.toLowerCase() === desc.toLowerCase());
    };

    const handleSelectSuggestion = (product: Product) => {
        skipNextSearchRef.current = true;
        setEntryRow({
            ...entryRow,
            stockCode: product.id,
            productId: product.id,
            description: product.description,
            price: product.price.toString(),
            qty: entryRow.qty || '1',
            originalProduct: product
        });
        setSuggestions([]);
        setShowSuggestions(false);
        setFocusedSuggestionIndex(-1);

        // Focus the qty field
        setTimeout(() => {
            const qtyInput = entryRowRef.current?.querySelector<HTMLInputElement>('input[data-field="qty"]');
            qtyInput?.focus();
            qtyInput?.select();
        }, 10);
    };

    const handleStockCodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedSuggestionIndex(prev => Math.max(prev - 1, 0));
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();

                // Priority 1: Exact stock code match
                const exactMatch = suggestions.find(s =>
                    s.id.toLowerCase() === entryRow.stockCode.trim().toLowerCase()
                );

                if (exactMatch) {
                    handleSelectSuggestion(exactMatch);
                    return;
                }

                // Priority 2: Focused suggestion (arrow key navigation)
                if (focusedSuggestionIndex >= 0 && suggestions[focusedSuggestionIndex]) {
                    handleSelectSuggestion(suggestions[focusedSuggestionIndex]);
                    return;
                }

                // Priority 3: First suggestion (fallback)
                if (suggestions.length > 0) {
                    handleSelectSuggestion(suggestions[0]);
                    return;
                }
            }
            if (e.key === 'Escape') {
                setShowSuggestions(false);
                setFocusedSuggestionIndex(-1);
                return;
            }
        }

        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const code = entryRow.stockCode.trim();
            if (code) {
                // If there's an exact match in suggestions or only one suggestion, select it
                const exactMatch = suggestions.find(s => s.id.toLowerCase() === code.toLowerCase());
                if (exactMatch) {
                    handleSelectSuggestion(exactMatch);
                    return;
                }

                if (suggestions.length === 1) {
                    handleSelectSuggestion(suggestions[0]);
                    return;
                }

                try {
                    // Call API with LIKE operator as requested
                    // stkmaster?pageno=1&recordsperpage=10&stockcode=like ASF001
                    const results = await api.products.getAll({
                        stockcode: `like ${code}`,
                        pageno: 1,
                        recordsperpage: 10
                    } as any);

                    if (results && results.length > 0) {
                        const apiItems = results.map((item: any) => transformApiProduct(item));

                        // "exactly the same stockcode record must be selected"
                        const exactMatch = apiItems.find(p => p.id.toLowerCase() === code.toLowerCase());

                        if (exactMatch) {
                            handleSelectSuggestion(exactMatch);
                            return;
                        }

                        // If records are more but no exact match, populate dropdown
                        setSuggestions(apiItems);
                        setShowSuggestions(true);
                        setFocusedSuggestionIndex(0);
                        return;
                    }

                    // If not found by API, check suggestions again or just move to description
                    if (suggestions.length > 0) {
                        setShowSuggestions(true);
                        setFocusedSuggestionIndex(0);
                        return;
                    }
                } catch (error) {
                    console.error('API product lookup failed:', error);
                }
            }

            // Move to description to allow manual entry or search if not found
            setTimeout(() => {
                const descInput = entryRowRef.current?.querySelector<HTMLInputElement>('input[data-field="description"]');
                descInput?.focus();
                descInput?.select();
            }, 10);
        }
    };

    // Handle description entry - lookup on Enter/Tab, populate entry row
    const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            // Logic similar to original: check stockcode match again if descriptions match
            if (entryRow.stockCode.trim()) {
                const product = lookupByStockCode(entryRow.stockCode);
                if (product) {
                    e.preventDefault();
                    setEntryRow({ ...entryRow, productId: product.id, description: product.description, price: product.price.toString(), qty: entryRow.qty || '1' });
                    setTimeout(() => entryRowRef.current?.querySelector<HTMLInputElement>('input[data-field="qty"]')?.focus(), 10);
                    return;
                }
            }
            if (entryRow.description.trim()) {
                const product = lookupByDescription(entryRow.description);
                if (product) {
                    e.preventDefault();
                    setEntryRow({ ...entryRow, productId: product.id, stockCode: product.id, description: product.description, price: product.price.toString(), qty: entryRow.qty || '1' });
                    setTimeout(() => entryRowRef.current?.querySelector<HTMLInputElement>('input[data-field="qty"]')?.focus(), 10);
                    return;
                }
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                entryRowRef.current?.querySelector<HTMLInputElement>('input[data-field="qty"]')?.focus();
            }
        }
    };

    const handleEntryFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, currentField: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const fieldOrder = ['stockCode', 'description', 'qty', 'price', 'discount', 'discountType'];
            const currentIndex = fieldOrder.indexOf(currentField);

            if (currentIndex === fieldOrder.length - 1) {
                if (entryRow.description.trim() || entryRow.stockCode.trim()) {
                    addManualItemToCart();
                }
            } else {
                const nextField = fieldOrder[currentIndex + 1];
                const nextInput = entryRowRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-field="${nextField}"]`);
                nextInput?.focus();
                if (nextInput instanceof HTMLInputElement) nextInput.select();
            }
        }
    };

    // ... (handleItemCodeEnter, handleUpdateItem, handleRemoveItem, getTxtp, handleTender, handleProceed)
    // I will implement them inline or as helpers if large. They are medium size.

    // Re-implementing methods for completeness

    const handleSelectProduct = (product: Product) => {
        addProductToCart(product);
        setModals(m => ({ ...m, product: false }));
    };

    const handleItemCodeEnter = () => {
        if (!itemScanCode.trim()) return;
        const foundProduct = lookupByStockCode(itemScanCode);
        if (foundProduct) {
            addProductToCart(foundProduct);
            setItemScanCode('');
        } else {
            alert(`Product with code "${itemScanCode}" not found.`);
        }
    };

    const handleUpdateItem = (itemId: string, field: keyof CartItem, value: string | number) => {
        const newItems = items.map(item => {
            if (item.id === itemId) {
                let parsedValue = value;
                if (typeof value === 'string' && (field === 'quantity' || field === 'price' || field === 'discount')) {
                    parsedValue = parseFloat(value) || 0;
                }
                return { ...item, [field]: parsedValue };
            }
            return item;
        });
        updateItems(newItems);
    };

    const handleRowValidating = (e: any) => {
        const newData = e.newData;
        const oldData = e.oldData;
        const isReturn = sale.type === 'return' || sale.type === 'account-return';

        // Price Validation
        if (newData.price !== undefined) {
            const isExcl = oldData.originalProduct?.vatCode === 'Z';
            const minPrice = oldData.originalProduct?.detailedPrice?.excl;

            if (isExcl && minPrice !== undefined && newData.price < minPrice) {
                // If the user hits Enter again on the SAME invalid price, revert to original
                if (lastInvalidPrice.current === newData.price) {
                    setTimeout(() => {
                        e.component.cancelEditData();
                        lastInvalidPrice.current = null;
                    }, 0);
                    return;
                }

                e.isValid = false;
                e.errorText = "Cannot Sell Below Cost Price";
                lastInvalidPrice.current = newData.price;

                notify({
                    message: "Cannot Sell Below Cost Price",
                    type: "error",
                    displayTime: 3000,
                    position: { at: "top center", my: "top center", offset: "0 50" }
                });
            } else {
                lastInvalidPrice.current = null;
            }
        }

        // Return Quantity Validation
        if (isReturn && newData.quantity !== undefined && sale.originalInvoiceItems && sale.originalInvoiceItems.length > 0 && !sale.isUnallocated) {
            const stockCode = oldData.productId;
            const originalItem = getOriginalInvoiceItem(stockCode);

            if (originalItem) {
                const originalQty = Math.abs(originalItem.quantity || 0);
                const newQty = Math.abs(newData.quantity);

                if (newQty > originalQty) {
                    e.isValid = false;
                    e.errorText = `QUANTITY EXCEEDED: Cannot return more than ${originalQty} units`;
                    notify({
                        message: `QUANTITY EXCEEDED: Cannot return more than ${originalQty} units of ${stockCode}`,
                        type: 'error',
                        displayTime: 4000,
                        position: { at: 'top center', my: 'top center', offset: '0 50' }
                    });
                }
            }
        }
    };

    const handleRemoveItem = (itemId: string) => {
        updateItems(items.filter(i => i.id !== itemId));
        setLastAction('remove');
    };

    const handleRowUpdating = (e: any) => {
        const itemId = e.key;
        const newData = e.newData;
        const isReturn = sale.type === 'return' || sale.type === 'account-return';

        // Ensure quantity is negative for returns
        if (isReturn && newData.quantity !== undefined && newData.quantity > 0) {
            newData.quantity = -Math.abs(newData.quantity);
        }

        // Update each field that changed
        Object.keys(newData).forEach(field => {
            handleUpdateItem(itemId, field as keyof CartItem, newData[field]);
        });
    };

    const getTxtp = (type: SaleState['type']): string => {
        switch (type) {
            case 'sale': case 'touch-sale': case 'touch-sale-classic': return 'POSCSH';
            case 'return': return 'POSCSR';
            case 'account': return 'POSASL';
            case 'account-return': return 'POSART';
            case 'order': return 'DEBSOR';
            case 'quotation': return 'DEBQOT';
            default: return 'POSCSH';
        }
    };

    const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalDiscount = items.reduce((sum, item) => sum + calculateLineDiscount(item), 0);
    const subTotalAfterDiscount = subTotal - totalDiscount;
    const vatAmount = subTotalAfterDiscount * VAT_RATE;
    const total = subTotalAfterDiscount + vatAmount;

    const handleTender = async (payments?: Payment[]) => {
        if (USE_MOCK_DATA) {
            setDocNumber(Date.now().toString().slice(-8));
            setModals({ product: false, tender: false, confirm: true, partsFinder: false, invoiceImport: false });
            return;
        }

        setOrderSaving(true);
        setOrderError(null);

        try {
            const txtp = getTxtp(sale.type);
            const isReturn = sale.type === 'return' || sale.type === 'account-return';

            // Build payload in the format expected by backend invoice API
            // mapped from original fields to new structure
            const invoicePayload = {
                data: [
                    {
                        // Structure fields
                        co: "01",
                        branch: customer?.branch || sale.headerDetails.warehouse?.split('-')[0] || "01",
                        txtp: txtp || "POSCSH",
                        trandate: sale.headerDetails.documentDate || new Date().toISOString().split('T')[0].replace(/-/g, '/'),
                        trantime: new Date().toTimeString().split(' ')[0],

                        // Customer/Account fields
                        account: customer?.id || "C",
                        custname: customer?.name || "CASH SALE",

                        // Transaction Details
                        reference: sale.headerDetails.referenceNo || "",
                        notes: (sale.headerDetails as any).notes || "",
                        salesrep: sale.headerDetails.salesRep?.split('-')[0] || "",

                        // Dates
                        paymentdate: sale.headerDetails.dueDate || sale.headerDetails.documentDate || new Date().toISOString().split('T')[0].replace(/-/g, '/'),
                        deliverydate: sale.headerDetails.deliveryDate || sale.headerDetails.documentDate || new Date().toISOString().split('T')[0].replace(/-/g, '/'),
                        duedate: sale.headerDetails.dueDate || sale.headerDetails.documentDate || new Date().toISOString().split('T')[0].replace(/-/g, '/'),

                        // Financial Totals
                        subtotal: subTotalAfterDiscount,
                        vat: vatAmount,
                        total: total,
                        nettotal: total,
                        vatindicator: sale.headerDetails.vatIndicator || 'I',

                        // Line Items
                        orderdetails: items.map((item, index) => ({
                            lineno: index + 1,
                            stockcode: item.productId || '',
                            description: item.description,
                            quantity: isReturn ? -Math.abs(item.quantity) : item.quantity,
                            price: item.price,
                            discperc: item.discountType === 'P' ? item.discount : 0,
                            discamt: item.discountType === 'V' ? item.discount : 0,
                            linetotal: (item.price * item.quantity) - calculateLineDiscount(item),
                            vatrate: VAT_RATE * 100,
                        })),

                        // Payments (if needed by backend in this structure)
                        payments: payments && payments.length > 0 ? payments.map((p, index) => ({
                            lineno: index + 1,
                            tendercode: p.method === 'Cash' ? 'CASH' : p.method === 'Credit Card' ? 'CARD' : p.method === 'EFT' ? 'EFT' : 'CASH',
                            amount: p.amount
                        })) : []
                    }
                ]
            };

            let result;
            if (sale.type === 'quotation') {
                // Quotations still use the old format
                const orderDetails = items.map((item, index) => ({
                    ORDLINENO: index + 1,
                    ORDSTKCODE: item.productId || '',
                    ORDDESC: item.description,
                    ORDQTY: isReturn ? -Math.abs(item.quantity) : item.quantity,
                    ORDPRICE: item.price,
                    ORDDISCPERC: item.discountType === 'P' ? item.discount : 0,
                    ORDDISCAMT: item.discountType === 'V' ? item.discount : 0,
                    ORDLINETOTAL: (item.price * item.quantity) - calculateLineDiscount(item),
                    ORDVATRATE: VAT_RATE * 100,
                }));

                const orderHeader = {
                    ORDDATE: sale.headerDetails.documentDate,
                    ORDCUSTCODE: customer?.id || 'CASH',
                    ORDCUSTNAME: customer?.name || 'CASH SALE',
                    TXTP: txtp,
                    ORDNETTOTAL: total,
                    ORDWHCODE: sale.headerDetails.warehouse?.split('-')[0] || '01',
                    ORDSALESREP: sale.headerDetails.salesRep?.split('-')[0] || '',
                    ORDVATINDICATOR: sale.headerDetails.vatIndicator || 'I',
                    ORDSUBTOTAL: subTotalAfterDiscount,
                    ORDVAT: vatAmount,
                    ORDTOTAL: total,
                    ORDTYPE: 'QUOTE',
                    ORDSTATUS: 'NEW',
                    ORDREF: sale.headerDetails.referenceNo || '',
                    ORDDELIVERYDATE: sale.headerDetails.deliveryDate,
                    ORDDUEDATE: sale.headerDetails.dueDate,
                } as any;

                result = await api.sales.quotes.create({ header: orderHeader, details: orderDetails });
            } else {
                // Use invoice API for cash sales with new payload format
                result = await api.sales.invoices.create(invoicePayload);
            }

            const docNo = (result as any)?.ORDNO || (result as any)?.header?.ORDNO || Date.now().toString().slice(-8);
            setDocNumber(docNo);
            setModals({ product: false, tender: false, confirm: true, partsFinder: false, invoiceImport: false });

        } catch (error: any) {
            console.error('Failed to create order:', error);
            setOrderError(error.message || 'Failed to save transaction');

            const result = await confirm(
                `API ERROR: ${error.message}\n\nDo you want to continue with offline mode and save locally?`,
                "SYSTEM OFFLINE PROMPT"
            );

            if (result) {
                setDocNumber('OFF-' + Date.now().toString().slice(-6));
                setModals({ product: false, tender: false, confirm: true, partsFinder: false, invoiceImport: false });
            }
        } finally {
            setOrderSaving(false);
        }
    };

    const handleProceed = useCallback(async () => {
        if (items.length === 0) return;
        if (orderSaving) return;

        if (sale.type === 'account' || sale.type === 'order') {
            if (customer && customer.creditLimit < total) {
                const message = `CREDIT LIMIT EXCEEDED: This transaction of ${formatCurrency(total)} will exceed the customer's credit limit of ${formatCurrency(customer.creditLimit)}.\n\nDo you want to proceed with this high-value transaction?`;
                const result = await confirm(message, "CREDIT LIMIT WARNING");
                if (!result) return;
            }
            handleTender();
        } else if (sale.type === 'account-return' || sale.type === 'quotation') {
            handleTender();
        } else {
            setModals(m => ({ ...m, tender: true }));
        }
    }, [items, sale.type, customer, total, orderSaving]);

    // Grid Columns State
    const [gridColumns, setGridColumns] = useState<GridColumnConfig[]>([
        { key: 'index', caption: '#', visible: true, width: 40 },
        { key: 'productId', caption: 'Stock Code', visible: true, width: 140 },
        { key: 'description', caption: 'Description', visible: true, minWidth: 200 },
        { key: 'quantity', caption: 'Qty', visible: true, width: 80, dataType: 'number', alignment: 'center' },
        { key: 'price', caption: 'Price', visible: true, width: 120, dataType: 'number' },
        { key: 'discount', caption: 'Discount', visible: true, width: 100, dataType: 'number' },
        { key: 'discountType', caption: 'Type', visible: true, width: 80, alignment: 'center' },
        { key: 'total', caption: 'Total', visible: true, width: 130 },
    ]);
    const [isGridCustomizerOpen, setIsGridCustomizerOpen] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState<{ x: number, y: number } | null>(null);

    // Initial Columns for Reset
    const DEFAULT_SALE_COLUMNS: GridColumnConfig[] = [
        // Transaction Specific
        { key: 'index', caption: '#', visible: true, width: 40 },
        { key: 'productId', caption: 'Stock Code', visible: true, width: 140 },
        { key: 'description', caption: 'Description', visible: true, minWidth: 200 },
        { key: 'quantity', caption: 'Qty', visible: true, width: 80, dataType: 'number', alignment: 'center' },
        { key: 'price', caption: 'Price', visible: true, width: 120, dataType: 'number' },
        { key: 'discount', caption: 'Discount', visible: true, width: 100, dataType: 'number' },
        { key: 'discountType', caption: 'Type', visible: true, width: 80, alignment: 'center' },
        { key: 'total', caption: 'Total', visible: true, width: 130 },

        // Inventory / STKMASTER Fields (Hidden by default)
        { key: 'barcode', caption: 'Barcode', visible: false, width: 120 },
        { key: 'binlocation', caption: 'Bin Location', visible: false, width: 100 },
        { key: 'deptcode', caption: 'Department', visible: false, width: 100 },
        { key: 'subdept', caption: 'Sub Dept', visible: false, width: 100 },
        { key: 'category1', caption: 'Category 1', visible: false, width: 100 },
        { key: 'category2', caption: 'Category 2', visible: false, width: 100 },
        { key: 'category3', caption: 'Category 3', visible: false, width: 100 },
        { key: 'category4', caption: 'Category 4', visible: false, width: 100 },
        { key: 'supplier', caption: 'Supplier', visible: false, width: 100 },
        { key: 'manufacturer', caption: 'Manufacturer', visible: false, width: 120 },
        { key: 'stock', caption: 'Qty On Hand', visible: false, width: 100, alignment: 'right' },
        { key: 'minqty', caption: 'Min Qty', visible: false, width: 80, alignment: 'right' },
        { key: 'maxqty', caption: 'Max Qty', visible: false, width: 80, alignment: 'right' },
        { key: 'reordertype', caption: 'Reorder Type', visible: false, width: 100 },
        { key: 'packsize', caption: 'Pack Size', visible: false, width: 100 },
        { key: 'weight', caption: 'Weight', visible: false, width: 80, alignment: 'right' },
        { key: 'itemlength', caption: 'Length', visible: false, width: 80, alignment: 'right' },
        { key: 'itembreadth', caption: 'Breadth', visible: false, width: 80, alignment: 'right' },
        { key: 'itemheight', caption: 'Height', visible: false, width: 80, alignment: 'right' },
        { key: 'stocktype', caption: 'Stock Type', visible: false, width: 80 },
        { key: 'status', caption: 'Status', visible: false, width: 80 },
        { key: 'linkcode', caption: 'Link Code', visible: false, width: 100 },
        { key: 'suggestedretail', caption: 'Suggested Retail', visible: false, width: 100, dataType: 'currency' },
        { key: 'lastcostexcl', caption: 'Last Cost Excl', visible: false, width: 100, dataType: 'currency' },
        { key: 'avgcostexcl', caption: 'Avg Cost Excl', visible: false, width: 100, dataType: 'currency' },
        { key: 'vatcode', caption: 'VAT Code', visible: false, width: 80 },
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
        { key: 'createdate', caption: 'Create Date', visible: false, width: 100, dataType: 'date' },
        { key: 'dtodate', caption: 'Last Edit Date', visible: false, width: 100, dataType: 'date' },
        { key: 'version', caption: 'Version', visible: false, width: 100 },

        // Promotion Fields
        { key: 'promfdate', caption: 'Prom From', visible: false, width: 100, dataType: 'date' },
        { key: 'promtdate', caption: 'Prom To', visible: false, width: 100, dataType: 'date' },
        { key: 'prommaxqty', caption: 'Prom Max Qty', visible: false, width: 100, alignment: 'right' },

        // Financial & Control
        { key: 'glsalesacc', caption: 'GL Sales Acc', visible: false, width: 100 },
        { key: 'glexpenseacc', caption: 'GL Expense Acc', visible: false, width: 100 },
        { key: 'customsgroup', caption: 'Customs Group', visible: false, width: 100 },
        { key: 'customsrate', caption: 'Customs Rate', visible: false, width: 100, alignment: 'right' },
        { key: 'commvalue', caption: 'Comm Value', visible: false, width: 80, alignment: 'right' },

        // Fabric & Misc
        { key: 'gramspersqm', caption: 'Grams/Sqm', visible: false, width: 100, alignment: 'right' },
        { key: 'fabricsqm', caption: 'Fabric Sqm', visible: false, width: 100, alignment: 'right' },
        { key: 'seasoncode', caption: 'Season Code', visible: false, width: 100 },
        { key: 'iswocommercesynced', caption: 'Woo Sync', visible: false, width: 80 },
        { key: 'stockimage', caption: 'Stock Image', visible: false, width: 200 },
        { key: 'kitfunction', caption: 'Kit Function', visible: false, width: 100 },
    ];

    // Load saved columns
    useEffect(() => {
        const saved = localStorage.getItem('pos_sale_items_grid_cols');
        if (saved) {
            try {
                const savedCols: GridColumnConfig[] = JSON.parse(saved);

                // Merge with DEFAULT_SALE_COLUMNS to pick up any NEW fields
                const savedMap = new Map(savedCols.map(c => [c.key, c]));
                const mergedCols = [...savedCols];

                DEFAULT_SALE_COLUMNS.forEach(defCol => {
                    if (!savedMap.has(defCol.key)) {
                        mergedCols.push(defCol);
                    }
                });

                setGridColumns(mergedCols);
            } catch (e) {
                setGridColumns(DEFAULT_SALE_COLUMNS);
            }
        } else {
            setGridColumns(DEFAULT_SALE_COLUMNS);
        }
    }, []);

    const handleSaveColumns = (newCols: GridColumnConfig[]) => {
        setGridColumns(newCols);
        localStorage.setItem('pos_sale_items_grid_cols', JSON.stringify(newCols));
        setIsGridCustomizerOpen(false);
    };

    // Close context menu on click
    useEffect(() => {
        const handleClick = () => setContextMenuPos(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Global Hotkeys for Screen
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (isGridCustomizerOpen || modals.product || modals.partsFinder || modals.tender || modals.confirm || modals.invoiceImport) return;

            // Shift + ? -> Open Product Search
            if (e.key === '?' && (e.shiftKey || e.key === '?')) { // Covers Shift+? or just ? if mapped
                e.preventDefault();
                setModals(m => ({ ...m, product: true }));
                return;
            }

            // Ctrl + R -> Reset Grid
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                setGridColumns(DEFAULT_SALE_COLUMNS);
                localStorage.removeItem('pos_sale_items_grid_cols');
                return;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isGridCustomizerOpen, modals]);

    useHotkeys({
        'Escape': () => {
            if (!isGridCustomizerOpen) onBack();
        },
        'F10': handleProceed,
        'F2': () => !modals.product && setModals(m => ({ ...m, partsFinder: true })),
    }, [items, onBack, handleProceed, isGridCustomizerOpen, modals.product]);

    const activeItem = items.find(item => item.id === activeItemId);
    const activeProduct = activeItem ? (
        activeItem.originalProduct ||
        products.find(p => p.id === activeItem.productId) ||
        MOCK_PARTS.find(p => p.id === activeItem.productId) ||
        // Fallback for manual/sundry items
        ({
            id: activeItem.productId || 'MANUAL',
            description: activeItem.description || 'Sundry Item',
            price: activeItem.price || 0,
            stock: 0,
            barcode: '',
            image: ''
        } as Product)
    ) : null;
    const isReturn = sale.type === 'return' || sale.type === 'account-return';

    return (
        <>
            <ProductSearchModal
                isOpen={modals.product}
                onClose={() => setModals(m => ({ ...m, product: false }))}
                onSelectProduct={handleSelectProduct}
                priceCategory={customer?.priceCategory}
            />
            <PartsFinderModal isOpen={modals.partsFinder} onClose={() => setModals(m => ({ ...m, partsFinder: false }))} onSelectProduct={addProductToCart} />
            <TenderModal isOpen={modals.tender} onClose={() => setModals(m => ({ ...m, tender: false }))} onTender={handleTender} sale={sale} isSaving={orderSaving} />
            <ConfirmationModal isOpen={modals.confirm} onClose={onComplete} docNumber={docNumber} />
            <InvoiceItemsImportModal
                isOpen={modals.invoiceImport}
                onClose={() => setModals(m => ({ ...m, invoiceImport: false }))}
                onImport={(selectedItems, allItems) => {
                    const isReturn = sale.type === 'return' || sale.type === 'account-return';
                    const newCartItems: CartItem[] = selectedItems.map((item, index) => ({
                        id: Date.now().toString() + index,
                        productId: item.stockcode || '',
                        description: item.description || '',
                        quantity: isReturn ? -Math.abs(item.quantity || 1) : (item.quantity || 1),
                        price: item.price || 0,
                        priceincl: item.priceincl || 0,
                        priceexcl: item.priceexcl || 0,
                        discount: item.discperc || 0,
                        discountType: 'P' as 'P' | 'V',
                        originalProduct: undefined
                    }));
                    setSale({ ...sale, items: [...items, ...newCartItems], originalInvoiceItems: allItems });
                    notify({
                        message: `Successfully imported ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''} from invoice ${sale.headerDetails.originalInvoiceNo}`,
                        type: 'success',
                        displayTime: 3000,
                        position: { at: 'top center', my: 'top center', offset: '0 50' }
                    });
                }}
                invoiceNo={sale.headerDetails.originalInvoiceNo || ''}
            />
            <ProductDetailModal isOpen={!!detailProduct} onClose={() => setDetailProduct(null)} product={detailProduct} />
            <ImageViewerModal isOpen={!!imageViewerProduct} onClose={() => setImageViewerProduct(null)} product={imageViewerProduct} />
            <WhatsAppSendModal
                isOpen={whatsAppModal.isOpen}
                onClose={() => setWhatsAppModal({ isOpen: false, template: null })}
                template={whatsAppModal.template}
                customer={customer}
                onConfirmSend={() => {
                    alert(`WhatsApp message sent to ${customer?.whatsapp || 'customer'}!`);
                    setWhatsAppModal({ isOpen: false, template: null });
                }}
            />

            {/* Context Menu */}
            {contextMenuPos && (
                <div
                    className="fixed z-[100] bg-white border border-slate-200 shadow-xl rounded-xl py-1 animate-in fade-in zoom-in duration-100"
                    style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
                    onClick={(e) => { e.stopPropagation(); setIsGridCustomizerOpen(true); setContextMenuPos(null); }}
                >
                    <button className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <span className="text-primary">⚙️</span> Customise grid
                    </button>
                </div>
            )}

            <GridCustomizerModal
                isOpen={isGridCustomizerOpen}
                onClose={() => setIsGridCustomizerOpen(false)}
                initialColumns={gridColumns}
                onSave={handleSaveColumns}
            />

            <div className={`flex flex-col h-full min-h-0 bg-white ${isReturn ? 'bg-red-50/10' : ''}`}>
                <div className="bg-primary text-white px-6 py-1.5 shrink-0 flex justify-between items-center shadow-md z-10">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-lg font-black uppercase tracking-tight leading-tight">
                            {customer ? customer.name : 'Walking Customer'}
                            <span className="text-xs ml-2 opacity-50 font-mono">({customer?.id || 'CASH'})</span>
                        </h2>
                        <div className="text-[9px] font-black opacity-70 uppercase tracking-[0.2em] leading-none">
                            {sale.type.replace('-', ' ')} in progress
                        </div>
                    </div>
                    <div className="text-3xl font-black tracking-tighter leading-none">
                        {formatCurrency(Math.abs(total))}
                    </div>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <main className="flex-1 flex flex-col p-2 pr-1 overflow-hidden bg-slate-100/50">
                        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
                            <div className="flex-1 min-h-0 bg-white flex flex-col">
                                <DataGrid
                                    dataSource={items}
                                    keyExpr="id"
                                    showBorders={false}
                                    focusedRowEnabled={true}
                                    onFocusedRowChanged={(e: any) => setActiveItemId(e.row?.data?.id || null)}
                                    onRowUpdating={handleRowUpdating}
                                    onRowValidating={handleRowValidating}
                                    onContextMenuPreparing={(e: any) => {
                                        if (e.row?.rowType === 'header' || e.row?.rowType === 'data' || e.row?.rowType === 'empty') {
                                            e.event.preventDefault();
                                            setContextMenuPos({ x: e.event.pageX, y: e.event.pageY });
                                        }
                                    }}
                                    className="items-datagrid"
                                    height="100%"
                                    columnAutoWidth={true}
                                    width="100%"
                                >
                                    <Selection mode="single" />
                                    <Scrolling mode="virtual" />
                                    <Editing
                                        mode="cell"
                                        allowUpdating={true}
                                        allowDeleting={false}
                                        useIcons={true}
                                    />

                                    {gridColumns.filter(c => c.visible).map(col => (
                                        <Column
                                            key={col.key}
                                            dataField={col.key === 'index' || col.key === 'total' ? undefined : col.key}
                                            caption={col.caption}
                                            width={col.width}
                                            minWidth={col.minWidth}
                                            alignment={col.alignment}
                                            dataType={col.dataType as any}
                                            format={col.dataType === 'currency' || col.key === 'price' ? { type: 'fixedPoint', precision: 2 } : undefined}
                                            allowEditing={col.key !== 'index' && col.key !== 'productId' && col.key !== 'description' && col.key !== 'total'}
                                            cellRender={(data) => {
                                                if (col.key === 'index') return items.indexOf(data.data) + 1;
                                                if (col.key === 'productId') return <span className="font-bold">{data.data.productId}</span>;
                                                if (col.key === 'description') return <span className="font-bold">{data.data.description}</span>;
                                                if (col.key === 'quantity') return <span className="font-bold">{Math.abs(data.data.quantity)}</span>;
                                                if (col.key === 'price') return <span className="font-bold">{formatCurrency(Math.abs(data.data.price))}</span>;
                                                if (col.key === 'discount') return <span className="font-bold">{data.data.discount}</span>;
                                                if (col.key === 'total') {
                                                    const item = data.data;
                                                    return <span className="font-bold">{formatCurrency(Math.abs((item.price * item.quantity) - calculateLineDiscount(item)))}</span>;
                                                }
                                                if (col.dataType === 'currency') return formatCurrency(data.value);
                                                return undefined;
                                            }}
                                        >
                                            {col.key === 'discountType' && (
                                                <Lookup
                                                    dataSource={[{ id: 'P', text: '%' }, { id: 'V', text: 'V' }]}
                                                    valueExpr="id"
                                                    displayExpr="text"
                                                />
                                            )}
                                        </Column>
                                    ))}

                                    <Column
                                        caption=""
                                        width={80}
                                        allowEditing={false}
                                        cellRender={(data) => (
                                            <div className="grid-action-cell">
                                                <button className="btn-icon danger" onClick={() => handleRemoveItem(data.data.id)}>🗑️</button>
                                                {data.data.originalProduct && <button className="btn-icon" onClick={() => setDetailProduct(data.data.originalProduct || null)}>ℹ️</button>}
                                            </div>
                                        )}
                                    />
                                </DataGrid>
                            </div>

                            {/* Manual Entry Row - Redesigned as a modern Bar */}
                            <div className="shrink-0 bg-slate-50 border-t border-slate-200 p-2.5 flex items-center gap-2 shadow-inner" ref={entryRowRef as any}>
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-black">+</div>
                                <div className="flex-1 grid grid-cols-12 gap-2">
                                    <div className="col-span-2 relative">
                                        <input
                                            ref={stockCodeInputRef}
                                            type="text"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                                            placeholder="Code / ?"
                                            value={entryRow.stockCode}
                                            onChange={e => {
                                                setEntryRow({ ...entryRow, stockCode: e.target.value });
                                                if (e.target.value.length >= 2) setShowSuggestions(true);
                                            }}
                                            onKeyDown={handleStockCodeKeyDown}
                                            onFocus={() => {
                                                if (entryRow.stockCode.length >= 2 && suggestions.length > 0) setShowSuggestions(true);
                                            }}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            data-field="stockCode"
                                            autoFocus
                                        />

                                        {/* Suggestions Dropdown */}
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute bottom-full left-0 w-[400px] mb-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
                                                <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggestions</span>
                                                    {isSearching && <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />}
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto" ref={suggestionsListRef}>
                                                    {suggestions.map((p, index) => (
                                                        <div
                                                            key={p.id}
                                                            className={`px-4 py-2.5 flex flex-col gap-0.5 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${focusedSuggestionIndex === index ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50'}`}
                                                            onClick={() => handleSelectSuggestion(p)}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-black text-slate-700 font-mono italic">{p.id}</span>
                                                                <span className="text-xs font-black text-primary">{formatCurrency(p.price)}</span>
                                                            </div>
                                                            <div className="text-[11px] font-bold text-slate-500 uppercase truncate">{p.description}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-4">
                                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" placeholder="Item Description" value={entryRow.description} onChange={e => setEntryRow({ ...entryRow, description: e.target.value })} onKeyDown={handleDescriptionKeyDown} data-field="description" />
                                    </div>
                                    <div className="col-span-1">
                                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-center" placeholder="Qty" value={entryRow.qty} onChange={e => setEntryRow({ ...entryRow, qty: e.target.value })} onKeyDown={e => handleEntryFieldKeyDown(e, 'qty')} data-field="qty" />
                                    </div>
                                    <div className="col-span-2">
                                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" placeholder="0.00" value={entryRow.price} onChange={e => setEntryRow({ ...entryRow, price: e.target.value })} onKeyDown={e => handleEntryFieldKeyDown(e, 'price')} data-field="price" />
                                    </div>
                                    <div className="col-span-1">
                                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" placeholder="Disc" value={entryRow.discount} onChange={e => setEntryRow({ ...entryRow, discount: e.target.value })} onKeyDown={e => handleEntryFieldKeyDown(e, 'discount')} data-field="discount" />
                                    </div>
                                    <div className="col-span-1">
                                        <select className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none cursor-pointer" value={entryRow.discountType} onChange={e => setEntryRow({ ...entryRow, discountType: e.target.value })} onKeyDown={e => handleEntryFieldKeyDown(e, 'discountType')} data-field="discountType">
                                            <option value="P">%</option>
                                            <option value="V">V</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <button className="w-full py-2 bg-primary text-white text-xs font-black uppercase tracking-tighter rounded-lg hover:bg-primary-dark active:scale-95 transition-all shadow-sm" onClick={addManualItemToCart}>Add</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    <aside className="w-96 flex flex-col p-2 pl-0 overflow-y-auto bg-slate-100/50 shrink-0">

                        {/* Product Detail Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg shadow-black/5 flex-1 flex flex-col min-h-0">
                            <div className="bg-[#17316c] px-4 py-3 shrink-0">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">Selected Item Details</h3>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                {/* Product Image Restoration */}
                                {(entryRow.originalProduct || activeProduct) && (
                                    <div className="px-4 py-1 flex justify-center shrink-0">
                                        {((entryRow.originalProduct?.image) || (activeProduct?.image)) ? (
                                            <div className="h-20 w-full bg-slate-50 rounded-lg border border-slate-100 p-0.5 cursor-zoom-in" onClick={() => setImageViewerProduct(entryRow.originalProduct || activeProduct)}>
                                                <img
                                                    src={(entryRow.originalProduct?.image) || (activeProduct?.image)}
                                                    alt="Product"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-6 flex items-center justify-center text-[10px] text-slate-300 italic">No Image Available</div>
                                        )}
                                    </div>
                                )}

                                <div className="px-4 py-1 flex flex-col items-center text-center shrink-0 mt-0.5">
                                    <h4 className="text-sm font-black text-primary leading-tight uppercase truncate w-full">
                                        {entryRow.originalProduct ? entryRow.originalProduct.description : (activeProduct ? activeProduct.description : 'NO ITEM SELECTED')}
                                    </h4>
                                </div>

                                {/* Dynamic Subheader */}
                                <div className="bg-[#17316c] px-4 py-2 mt-0.5 flex items-center shrink-0">
                                    <span className="text-xs font-black text-white uppercase tracking-widest leading-none">
                                        {entryRow.originalProduct ? 'Item Statistics' : 'Document Statistics'}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide">
                                    {entryRow.originalProduct ? (
                                        /* Item Statistics View */
                                        <div className="flex flex-col gap-2">
                                            {[
                                                { label: 'ON HAND', value: Math.floor(entryRow.originalProduct.STKQTYONHAND || entryRow.originalProduct.qtyonhand || 0), color: (entryRow.originalProduct.STKQTYONHAND || entryRow.originalProduct.qtyonhand || 0) <= 0 ? 'text-red-600' : 'text-black', suffix: ' UNITS AVAILABLE' },
                                                { label: 'ON SALES ORDER', value: Math.floor(entryRow.originalProduct.STKQTYALLOCATED || entryRow.originalProduct.qtyallocated || 0), color: 'text-black' },
                                                { label: 'ON ORDER', value: Math.floor(entryRow.originalProduct.STKQTYONORDER || entryRow.originalProduct.qtyonorder || 0), color: 'text-black' },
                                                { label: 'ON DISPATCH', value: Math.floor(entryRow.originalProduct.STKQTYONDISPATCH || 0), color: 'text-black' },
                                                { label: 'ON LAYBY', value: Math.floor(entryRow.originalProduct.STKQTYONLAYBY || 0), color: 'text-black' },
                                                { label: 'AVAILABLE', value: Math.floor(entryRow.originalProduct.STKQTYAVAILABLE || entryRow.originalProduct.stock || 0), color: (entryRow.originalProduct.STKQTYAVAILABLE || entryRow.originalProduct.stock || 0) <= 0 ? 'text-red-600' : 'text-black', suffix: ' UNITS AVAILABLE' },
                                                { label: 'PRICE CODE', value: entryRow.originalProduct.STKPRICELEVEL || '01', color: 'text-black' },
                                                { label: 'BIN LOCATION', value: entryRow.originalProduct.STKBINLOCATION || entryRow.originalProduct.binlocation || '---', color: 'text-black' },
                                                { label: 'LAST PRICE PAID', value: (entryRow.originalProduct.STKLASTCOST || 0).toFixed(2), color: 'text-black' },
                                                { label: 'COST CODE(INCL)', value: entryRow.originalProduct.STKCOSTCODE || 'RH-HR', color: 'text-black' },
                                            ].map((field, i) => (
                                                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                                                    <span className="text-xs uppercase font-bold text-[#17316c] tracking-tight">{field.label}</span>
                                                    <span className={`text-sm font-black ${field.color} flex items-center gap-1`}>
                                                        {field.value}
                                                        {field.suffix && <span className="text-[9px] opacity-70">{field.suffix}</span>}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* Document Statistics View */
                                        <div className="flex flex-col gap-2">
                                            {[
                                                { label: 'VAT INDICATOR', value: VAT_INDICATOR_OPTIONS[sale.headerDetails?.vatIndicator as keyof typeof VAT_INDICATOR_OPTIONS] || (sale.headerDetails?.vatIndicator || 'INCLUSIVE'), color: 'text-red-500' },
                                                { label: 'NO. OF ITEMS', value: Math.abs(items.reduce((acc, i) => acc + i.quantity, 0)).toFixed(2), color: 'text-black' },
                                                { label: 'NO. OF LINES', value: items.length, color: 'text-black' },
                                                { label: 'LINE DISCOUNT', value: formatCurrency(Math.abs(items.reduce((acc, i) => acc + calculateLineDiscount(i), 0))), color: 'text-black' },
                                                { label: 'DOC. DISCOUNTS', value: formatCurrency(0), color: 'text-black' },
                                                { label: 'TOTAL WEIGHT', value: Math.abs(items.reduce((acc, i) => acc + (i.originalProduct?.weight || 0) * i.quantity, 0)).toFixed(2), color: 'text-black' },
                                                { label: 'SALES REP', value: sale.headerDetails?.salesRep || '---', color: 'text-black' },
                                                { label: 'GP% COSTCODE', value: 'DG-LO', color: 'text-black' },
                                            ].map((field, i) => (
                                                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                                                    <span className="text-xs uppercase font-bold text-[#17316c] tracking-tight">{field.label}</span>
                                                    <span className={`text-[15px] font-black ${field.color}`}>{field.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                <div className="bg-slate-900 border-t border-black text-white px-8 py-5 shrink-0 flex justify-between items-center shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.3)] z-10">
                    <div className="flex gap-6 items-center">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sub Total</span>
                            <span className="text-xl font-bold leading-none">{formatCurrency(Math.abs(subTotal))}</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-700 pl-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Discount</span>
                            <span className="text-xl font-bold leading-none text-red-500">{totalDiscount > 0 ? `- ${formatCurrency(Math.abs(totalDiscount))}` : formatCurrency(0)}</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-700 pl-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total VAT</span>
                            <span className="text-xl font-bold leading-none mb-1">{formatCurrency(Math.abs(vatAmount))}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-md active:scale-95 transition-all flex items-center gap-2" onClick={() => setModals(m => ({ ...m, partsFinder: true }))}>
                            <span>Parts Finder</span>
                            <kbd className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-1">F2</kbd>
                        </button>
                        <button className="px-10 py-3 bg-transparent border-2 border-slate-700 text-white hover:bg-slate-800 hover:border-white font-black rounded-xl transition-all text-lg flex items-center gap-2" onClick={onBack}>
                            <span>Go back to previous screen</span>
                        </button>
                        <button
                            className={`
                                group relative overflow-hidden px-10 py-3 rounded-xl font-black text-lg transition-all active:scale-95 shadow-2xl
                                ${items.length === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-success hover:bg-success/90 text-white'}
                            `}
                            disabled={items.length === 0}
                            onClick={handleProceed}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {sale.type === 'account' ? 'FINISH SALE' :
                                    sale.type === 'account-return' ? 'FINISH RETURN' :
                                        sale.type === 'order' ? 'FINISH ORDER' :
                                            sale.type === 'quotation' ? 'FINISH QUOTATION' :
                                                'PROCEED'}
                                <kbd className="text-[9px] bg-black/20 px-1 py-0.5 rounded opacity-80 group-hover:opacity-100 transition-opacity">F10</kbd>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
