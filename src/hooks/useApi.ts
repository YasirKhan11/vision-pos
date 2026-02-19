/**
 * Vision API React Hooks
 * 
 * Custom hooks for using the Vision API in React components.
 * Provides loading states, error handling, and caching.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, HttpError } from '../api';
import type {
  StockItem,
  Customer,
  TenderType,
  Branch,
  Warehouse,
  Department
} from '../types/api.types';

// ============================================
// Generic Async Hook
// ============================================

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncOptions {
  immediate?: boolean;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncOptions = { immediate: true }
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: options.immediate ?? true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await asyncFn();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error: any) {
      const message = error instanceof HttpError
        ? error.message
        : error.message || 'An error occurred';
      setState(prev => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, [asyncFn]);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, []);

  return { ...state, execute, refetch: execute };
}

// ============================================
// Authentication Hook
// ============================================

interface AuthState {
  isLoggedIn: boolean;
  user: any | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: api.auth.isLoggedIn(),
    user: api.auth.getCurrentUser(),
    loading: false,
  });

  const login = useCallback(async (username: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const response = await api.auth.login({ username, password });
      setState({
        isLoggedIn: true,
        user: response.user,
        loading: false,
      });
      return response;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    api.auth.logout();
    setState({
      isLoggedIn: false,
      user: null,
      loading: false,
    });
  }, []);

  return { ...state, login, logout };
}

// ============================================
// Products Hook
// ============================================

interface UseProductsOptions {
  autoLoad?: boolean;
  pageSize?: number;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { autoLoad = true, pageSize = 50 } = options;

  const [products, setProducts] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadProducts = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 1 : page;
      const data = await api.products.getAll({
        pageno: currentPage,
        recordsperpage: pageSize,
        STKACTIVE: 1,
      });

      if (reset) {
        setProducts(data);
        setPage(1);
      } else {
        setProducts(prev => [...prev, ...data]);
      }

      setHasMore(data.length === pageSize);
      if (!reset) setPage(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const search = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.products.search(term);
      setProducts(data.items);
      setHasMore(false);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByBarcode = useCallback(async (barcode: string) => {
    try {
      return await api.products.searchByBarcode(barcode);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadProducts(true);
    }
  }, []);

  return {
    products,
    loading,
    error,
    hasMore,
    loadMore: () => loadProducts(false),
    refresh: () => loadProducts(true),
    search,
    searchByBarcode,
  };
}

// ============================================
// Customers Hook
// ============================================

interface UseCustomersOptions {
  autoLoad?: boolean;
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const { autoLoad = false } = options;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.customers.getAll({ pageno: 1, recordsperpage: 500 });
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setCustomers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.customers.search(term);
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const getByCode = useCallback(async (code: string) => {
    try {
      return await api.customers.getByCode(code);
    } catch {
      return null;
    }
  }, []);

  const checkCredit = useCallback(async (code: string, amount: number) => {
    return api.customers.checkCredit(code, amount);
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadAll();
    }
  }, []);

  return {
    customers,
    loading,
    error,
    loadAll,
    search,
    getByCode,
    checkCredit,
  };
}

// ============================================
// System Data Hook
// ============================================

interface SystemData {
  branches: Branch[];
  warehouses: Warehouse[];
  tenders: TenderType[];
  departments: Department[];
}

export function useSystemData() {
  const [data, setData] = useState<SystemData>({
    branches: [],
    warehouses: [],
    tenders: [],
    departments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cached = await api.system.cache.get();
      setData({
        branches: cached.branches || [],
        warehouses: cached.warehouses || [],
        tenders: cached.tenders || [],
        departments: cached.departments || [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load system data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  return { ...data, loading, error, refresh: load };
}

// ============================================
// POS Sale Hook
// ============================================

interface POSItem {
  id: string;
  stockCode: string;
  description: string;
  quantity: number;
  price: number;
  discount: number;
  discountType: 'P' | 'V';
  vatRate: number;
}

export function usePOSSale() {
  const [items, setItems] = useState<POSItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [processing, setProcessing] = useState(false);

  const addItem = useCallback((item: Omit<POSItem, 'id'>) => {
    const newItem: POSItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<POSItem>) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  const totals = api.pos.calculateTotals(items.map(i => ({
    stockCode: i.stockCode,
    description: i.description,
    quantity: i.quantity,
    price: i.price,
    discount: i.discount,
    discountType: i.discountType,
    vatRate: i.vatRate,
  })));

  const processSale = useCallback(async (type: 'SALE' | 'RETURN' | 'QUOTE' = 'SALE') => {
    setProcessing(true);

    try {
      const sale = {
        customer,
        items: items.map(i => ({
          stockCode: i.stockCode,
          description: i.description,
          quantity: i.quantity,
          price: i.price,
          discount: i.discount,
          discountType: i.discountType,
          vatRate: i.vatRate,
        })),
        payments: [],
        type,
      };

      const validation = api.pos.validateSale(sale);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const order = await api.pos.processSale(sale);

      // Clear after successful sale
      setItems([]);
      setCustomer(null);

      return order;
    } finally {
      setProcessing(false);
    }
  }, [items, customer]);

  return {
    items,
    customer,
    totals,
    processing,
    addItem,
    updateItem,
    removeItem,
    clearItems,
    setCustomer,
    processSale,
  };
}

// ============================================
// Export all hooks
// ============================================

export const hooks = {
  useAuth,
  useAsync,
  useProducts,
  useCustomers,
  useSystemData,
  usePOSSale,
};

export default hooks;
