/**
 * Vision API Context
 * 
 * Provides global API state and methods to all components.
 * Handles authentication, system data caching, and data transformation.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, HttpError, tokenManager } from '../api';
import type {
  StockItem,
  Customer as ApiCustomer,
  TenderType,
  Branch,
  Warehouse,
  Department,
  SalesRep,
  Category
} from '../types/api.types';

// ============================================
// Frontend Types (matching existing UI)
// ============================================

export interface Customer {
  id: string;
  name: string;
  creditLimit: number;
  address: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  email: string;
  phone: string;
  cellphone?: string;
  whatsapp?: string;
  contactPerson?: string;
  vatNumber?: string;
  registrationNumber?: string;
  insights?: CustomerInsights;
  loyalty?: LoyaltyInfo;
  birthday?: string;
  preferredContact?: 'email' | 'whatsapp' | 'sms' | 'phone';
  priceLevel?: number;
  balance?: number;
}

export interface CustomerInsights {
  lastVisit: string;
  daysSinceLastVisit: number;
  totalTransactions: number;
  totalSpend: number;
  averageBasket: number;
  rfmSegment: 'Champion' | 'Loyal' | 'Potential' | 'At Risk' | 'Lost' | 'New';
  topProducts: string[];
  purchaseFrequency: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Occasional';
}

export interface LoyaltyInfo {
  pointsBalance: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tierProgress: number;
  pointsToNextTier: number;
  memberSince: string;
  lifetimePoints: number;
  pendingRewards: number;
}

export interface Product {
  id: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  images?: string[];
  barcode?: string;
  categoryId?: string;
  department?: string;
  vatRate?: number;
  costPrice?: number;
  attributes?: { [key: string]: string | number };
}

export interface PaymentMethod {
  code: string;
  name: string;
  type: string;
  requiresReference: boolean;
  opensDrawer: boolean;
}

// ============================================
// Data Transformation Functions
// ============================================

/**
 * Transform API StockItem to frontend Product
 */
export function transformProduct(item: any): Product {
  return {
    id: item.stockcode || item.STKCODE,
    description: item.description1 || item.STKDESC || '',
    price: item.sugsell || item.STKPRICE1 || 0,
    stock: item.qtyonhand || item.STKQTYONHAND || 0,
    barcode: item.barcode || item.STKBARCODE,
    categoryId: item.category1 || item.STKCATEGORY1,
    department: item.deptcode || item.STKDEPT,
    vatRate: 15, // Default VAT rate, adjust if needed
    costPrice: item.lastcostexcl || item.STKCOSTPRICE,
    image: item.imageurl || item.STKIMAGE || undefined,
    images: item.imageurl ? [item.imageurl] : (item.STKIMAGE ? [item.STKIMAGE] : undefined),
  };
}

/**
 * Transform API Customer to frontend Customer
 */
export function transformCustomer(cust: ApiCustomer): Customer {
  const address = [cust.DEBADDR1, cust.DEBADDR2, cust.DEBADDR3, cust.DEBADDR4]
    .filter(Boolean)
    .join('\n');

  return {
    id: cust.DEBCODE,
    name: cust.DEBNAME || '',
    creditLimit: cust.DEBCREDITLIMIT || 0,
    address: address || '',
    address1: cust.DEBADDR1,
    address2: cust.DEBADDR2,
    city: cust.DEBADDR4,
    state: cust.DEBPOSTCODE,
    email: cust.DEBEMAIL || '',
    phone: cust.DEBPHONE || '',
    cellphone: cust.DEBPHONE,
    whatsapp: cust.DEBPHONE ? `27${cust.DEBPHONE.replace(/\D/g, '').slice(-9)}` : '',
    contactPerson: cust.DEBCONTACT,
    vatNumber: cust.DEBVATNO,
    priceLevel: cust.DEBPRICELEVEL,
    balance: cust.DEBBALANCE,
    // Insights and loyalty would come from additional API calls if available
    insights: undefined,
    loyalty: cust.DEBLOYALTYPOINTS ? {
      pointsBalance: cust.DEBLOYALTYPOINTS,
      tier: determineTier(cust.DEBLOYALTYPOINTS),
      tierProgress: 0,
      pointsToNextTier: 0,
      memberSince: cust.DEBCREATEDDATE || '',
      lifetimePoints: cust.DEBLOYALTYPOINTS,
      pendingRewards: cust.DEBLOYALTYPOINTS * 0.01,
    } : undefined,
  };
}

function determineTier(points: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' {
  if (points >= 50000) return 'Platinum';
  if (points >= 20000) return 'Gold';
  if (points >= 5000) return 'Silver';
  return 'Bronze';
}

/**
 * Transform API TenderType to frontend PaymentMethod
 */
export function transformTender(tender: TenderType): PaymentMethod {
  return {
    code: tender.TENDERCODE,
    name: tender.TENDERDESC,
    type: tender.TENDERTYPE,
    requiresReference: tender.REQUIRESREF || false,
    opensDrawer: tender.OPENSCASHDRAWER || false,
  };
}

// ============================================
// Default Cash Customer
// ============================================

export const CASH_CUSTOMER: Customer = {
  id: 'CASH',
  name: 'CASH SALE',
  creditLimit: 0,
  address: 'CUSTOMER NOT SPECIFIED',
  address1: '',
  address2: '',
  city: '',
  state: '',
  email: '',
  phone: '',
  cellphone: '',
  whatsapp: '',
  contactPerson: '',
  vatNumber: '',
  registrationNumber: ''
};

// ============================================
// API Context Type
// ============================================

interface ApiContextType {
  // Auth state
  isAuthenticated: boolean;
  user: { username: string } | null;
  loginLoading: boolean;
  loginError: string | null;

  // Auth actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  // System data
  branches: Branch[];
  warehouses: Warehouse[];
  tenders: PaymentMethod[];
  departments: Department[];
  salesReps: SalesRep[];
  categories: Category[];
  systemLoading: boolean;
  systemError: string | null;
  vatRate: number;
  cashCustomerCode: string;
  defaultWarehouse: string;

  // Products
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  loadProducts: () => Promise<void>;
  searchProducts: (term: string) => Promise<Product[]>;
  searchByBarcode: (barcode: string) => Promise<Product | null>;
  getProductByCode: (code: string) => Promise<Product | null>;

  // Customers
  customers: Customer[];
  customersLoading: boolean;
  customersError: string | null;
  loadCustomers: () => Promise<void>;
  searchCustomers: (term: string) => Promise<Customer[]>;
  getCustomerByCode: (code: string) => Promise<Customer | null>;

  // Orders
  createOrder: (orderData: any) => Promise<any>;
  orderLoading: boolean;
  orderError: string | null;

  // Utilities
  refreshSystemData: () => Promise<void>;
}

// ============================================
// Context Creation
// ============================================

const ApiContext = createContext<ApiContextType | null>(null);

export function useApi(): ApiContextType {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

// ============================================
// Provider Component
// ============================================

interface ApiProviderProps {
  children: ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(api.auth.isLoggedIn());
  const [user, setUser] = useState(api.auth.getCurrentUser());
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // System data state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [tenders, setTenders] = useState<PaymentMethod[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [systemLoading, setSystemLoading] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [vatRate, setVatRate] = useState(15);
  const [cashCustomerCode, setCashCustomerCode] = useState('CASH');
  const [defaultWarehouse, setDefaultWarehouse] = useState('01');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);

  // Order state
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // ==========================================
  // Auth Methods
  // ==========================================

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await api.auth.login({ username, password });
      setIsAuthenticated(true);
      setUser(response.user || { username });

      // Load system data after login
      await loadSystemData();

      return true;
    } catch (error: any) {
      const message = error.message || 'Login failed';
      setLoginError(message);
      return false;
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.auth.logout();
    setIsAuthenticated(false);
    setUser(null);
    setProducts([]);
    setCustomers([]);
    setBranches([]);
    setWarehouses([]);
    setTenders([]);
  }, []);

  // ==========================================
  // System Data Methods
  // ==========================================

  const loadSystemData = useCallback(async () => {
    setSystemLoading(true);
    setSystemError(null);

    try {
      // Load all system data in parallel
      const [
        branchData,
        warehouseData,
        tenderData,
        deptData,
        repData,
        vat,
        cashCode,
        defWh
      ] = await Promise.all([
        api.branches.getAll().catch(() => []),
        api.warehouses.getAll().catch(() => []),
        api.tenders.getActive().catch(() => []),
        api.departments.getAll().catch(() => []),
        api.salesReps.getActive().catch(() => []),
        api.parameters.getVATRate().catch(() => 15),
        api.parameters.getCashCustomerCode().catch(() => 'CASH'),
        api.parameters.getDefaultWarehouse().catch(() => '01'),
      ]);

      setBranches(branchData);
      setWarehouses(warehouseData);
      setTenders(tenderData.map(transformTender));
      setDepartments(deptData);
      setSalesReps(repData);
      setVatRate(vat);
      setCashCustomerCode(cashCode);
      setDefaultWarehouse(defWh);

    } catch (error: any) {
      setSystemError(error.message || 'Failed to load system data');
    } finally {
      setSystemLoading(false);
    }
  }, []);

  const refreshSystemData = useCallback(async () => {
    api.system.cache.clear();
    await loadSystemData();
  }, [loadSystemData]);

  // ==========================================
  // Product Methods
  // ==========================================

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);

    try {
      const data = await api.products.getAll({
        pageno: 1,
        include_stock_image: true,
        recordsperpage: 500
      });
      setProducts(data.map(transformProduct));
    } catch (error: any) {
      setProductsError(error.message || 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (term: string): Promise<Product[]> => {
    if (!term.trim()) return products;

    try {
      const data = await api.products.search(term);
      return data.items.map(transformProduct);
    } catch {
      // Fallback to local search
      const lower = term.toLowerCase();
      return products.filter(p =>
        p.id.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower)
      );
    }
  }, [products]);

  const searchByBarcode = useCallback(async (barcode: string): Promise<Product | null> => {
    try {
      const item = await api.products.searchByBarcode(barcode);
      return item ? transformProduct(item) : null;
    } catch {
      // Fallback to local search
      return products.find(p => p.barcode === barcode || p.id === barcode) || null;
    }
  }, [products]);

  const getProductByCode = useCallback(async (code: string): Promise<Product | null> => {
    // Check local cache first
    const cached = products.find(p => p.id === code);
    if (cached) return cached;

    try {
      const item = await api.products.getByCode(code);
      return item ? transformProduct(item) : null;
    } catch {
      return null;
    }
  }, [products]);

  // ==========================================
  // Customer Methods
  // ==========================================

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    setCustomersError(null);

    try {
      const data = await api.customers.getAll({
        pageno: 1,
        recordsperpage: 500
      });
      const transformed = data.map(transformCustomer);
      // Add cash customer at the beginning
      setCustomers([CASH_CUSTOMER, ...transformed]);
    } catch (error: any) {
      setCustomersError(error.message || 'Failed to load customers');
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const searchCustomers = useCallback(async (term: string): Promise<Customer[]> => {
    if (!term.trim()) return customers;

    try {
      const data = await api.customers.search(term);
      return data.map(transformCustomer);
    } catch {
      // Fallback to local search
      const lower = term.toLowerCase();
      return customers.filter(c =>
        c.id.toLowerCase().includes(lower) ||
        c.name.toLowerCase().includes(lower) ||
        c.phone.includes(term)
      );
    }
  }, [customers]);

  const getCustomerByCode = useCallback(async (code: string): Promise<Customer | null> => {
    if (code === 'CASH') return CASH_CUSTOMER;

    // Check local cache first
    const cached = customers.find(c => c.id === code);
    if (cached) return cached;

    try {
      const cust = await api.customers.getByCode(code);
      return cust ? transformCustomer(cust) : null;
    } catch {
      return null;
    }
  }, [customers]);

  // ==========================================
  // Order Methods
  // ==========================================

  const createOrder = useCallback(async (orderData: any): Promise<any> => {
    setOrderLoading(true);
    setOrderError(null);

    try {
      const order = await api.orders.create(orderData);
      return order;
    } catch (error: any) {
      setOrderError(error.message || 'Failed to create order');
      throw error;
    } finally {
      setOrderLoading(false);
    }
  }, []);

  // ==========================================
  // Effects
  // ==========================================

  // Check auth on mount
  useEffect(() => {
    if (api.auth.isLoggedIn()) {
      setIsAuthenticated(true);
      setUser(api.auth.getCurrentUser());
      loadSystemData();
    }
  }, []);

  // ==========================================
  // Context Value
  // ==========================================

  const value: ApiContextType = {
    // Auth
    isAuthenticated,
    user,
    loginLoading,
    loginError,
    login,
    logout,

    // System
    branches,
    warehouses,
    tenders,
    departments,
    salesReps,
    categories,
    systemLoading,
    systemError,
    vatRate,
    cashCustomerCode,
    defaultWarehouse,
    refreshSystemData,

    // Products
    products,
    productsLoading,
    productsError,
    loadProducts,
    searchProducts,
    searchByBarcode,
    getProductByCode,

    // Customers
    customers,
    customersLoading,
    customersError,
    loadCustomers,
    searchCustomers,
    getCustomerByCode,

    // Orders
    createOrder,
    orderLoading,
    orderError,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}

export default ApiProvider;
