import { SaleState, Customer, CartItem } from '../types/domain.types';
import { api } from '../api';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const getDefaultSalesRep = () => {
    const settings = api.auth.getCurrentUserSettings();
    return settings?.defsalesrep || '101-MZ';
};

const getDefaultWarehouse = (fallback: string) => {
    const settings = api.auth.getCurrentUserSettings();
    return settings?.defbranch || settings?.defco || fallback;
};

export const createInitialSale = (defaultWarehouse: string = '01-ShopFloor'): SaleState => ({
    type: 'sale',
    customer: null,
    headerDetails: {
        documentDate: getTodayDateString(),
        deliveryDate: getTodayDateString(),
        dueDate: getTodayDateString(),
        referenceNo: '',
        warehouse: defaultWarehouse,
        salesRep: getDefaultSalesRep(),
        mainSalesrep: getDefaultSalesRep(),
        vatIndicator: 'I',
        deliveryMethod: '',
        addressSelection: '',
    },
    items: [],
});

export const createTouchSale = (defaultWarehouse: string = '01-ShopFloor'): SaleState => {
    const initialItems: CartItem[] = [
        { id: 'cart_item_1001_1', productId: '1001', description: 'Numeric Product 1', quantity: 5, price: 10.00, discount: 0, discountType: 'P' },
        { id: 'cart_item_1002_1', productId: '1002', description: 'Numeric Product 2', quantity: 1, price: 25.50, discount: 0, discountType: 'P' },
        { id: 'cart_item_1003_1', productId: '1003', description: 'Numeric Product 3', quantity: 5.75, price: 5.75, discount: 0, discountType: 'P' },
    ];

    return {
        type: 'touch-sale-classic',
        customer: null,
        headerDetails: {
            documentDate: getTodayDateString(),
            deliveryDate: getTodayDateString(),
            dueDate: getTodayDateString(),
            referenceNo: '',
            warehouse: defaultWarehouse,
            salesRep: getDefaultSalesRep(),
            mainSalesrep: getDefaultSalesRep(),
            vatIndicator: 'I',
            deliveryMethod: 'In-Store',
            addressSelection: '',
        },
        items: initialItems,
    };
};

export const createAccountSale = (): SaleState => ({
    type: 'account',
    customer: null,
    headerDetails: {
        documentDate: getTodayDateString(),
        deliveryDate: getTodayDateString(),
        dueDate: getTodayDateString(),
        referenceNo: '',
        warehouse: getDefaultWarehouse('01-ShopFloor'),
        salesRep: getDefaultSalesRep(),
        mainSalesrep: getDefaultSalesRep(),
        vatIndicator: 'I',
        deliveryMethod: '',
        addressSelection: '',
    },
    items: [],
});

export const createCashReturn = (): SaleState => ({
    type: 'return',
    customer: null,
    headerDetails: {
        documentDate: getTodayDateString(),
        deliveryDate: getTodayDateString(),
        dueDate: getTodayDateString(),
        referenceNo: '',
        warehouse: getDefaultWarehouse('01-ShopFloor'),
        salesRep: getDefaultSalesRep(),
        mainSalesrep: getDefaultSalesRep(),
        vatIndicator: 'I',
        deliveryMethod: '',
        addressSelection: '',
        originalInvoiceNo: '',
    },
    items: [],
});

export const createAccountReturn = (): SaleState => ({
    type: 'account-return',
    customer: null,
    headerDetails: {
        documentDate: getTodayDateString(),
        deliveryDate: getTodayDateString(),
        dueDate: getTodayDateString(),
        referenceNo: '',
        warehouse: getDefaultWarehouse('01-ShopFloor'),
        salesRep: getDefaultSalesRep(),
        mainSalesrep: getDefaultSalesRep(),
        vatIndicator: 'I',
        deliveryMethod: '',
        addressSelection: '',
        originalInvoiceNo: '',
    },
    items: [],
});

export const createDashboardSale = (type: 'order' | 'quotation', customer: Customer): SaleState => ({
    type: type,
    customer: customer,
    headerDetails: {
        documentDate: getTodayDateString(),
        deliveryDate: getTodayDateString(),
        dueDate: getTodayDateString(),
        referenceNo: '',
        warehouse: getDefaultWarehouse('01-ShopFloor'),
        salesRep: getDefaultSalesRep(),
        mainSalesrep: getDefaultSalesRep(),
        vatIndicator: 'I',
        deliveryMethod: '',
        addressSelection: '',
    },
    items: [],
});
