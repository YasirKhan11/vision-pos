/**
 * Vision API Product/Stock Service
 * 
 * Handles all stock/inventory related operations:
 * - Stock master (products)
 * - Pricing
 * - Alternative barcodes
 * - Stock balances
 * - Categories
 * - Batches
 * - Variants
 */

import { ENDPOINTS, API_CONFIG } from './config';
import { httpClient } from './httpClient';
import type {
  StockItem,
  StockPrice,
  DetailedStockPrice,
  StockAltBarcode,
  StockBalance,
  StockBatch,
  StockVariant,
  Category,
  QueryParams,
  ApiResponse,
  PaginatedResponse
} from '../types/api.types';

// ============================================
// Stock Master Service
// ============================================

export const productService = {
  /**
   * Get all products with optional filtering
   * 
   * @param params - Query parameters for filtering
   * @example
   * // Get all active products
   * productService.getAll({ STKACTIVE: 1 })
   * 
   * // Search by code
   * productService.getAll({ STKCODE: 'ABC%' })
   * 
   * // Paginated
   * productService.getAll({ pageno: 1, recordsperpage: 50 })
   */
  async getAll(params?: QueryParams): Promise<StockItem[]> {
    const response = await httpClient.get<any>(ENDPOINTS.STOCK.MASTER, { params });
    const items = response.data?.data || response.data || [];
    return Array.isArray(items) ? items : [];
  },

  /**
   * Get a single product by stock code
   */
  async getByCode(stockCode: string): Promise<StockItem | null> {
    const response = await httpClient.get<any>(ENDPOINTS.STOCK.MASTER, {
      params: { STKCODE: stockCode }
    });
    const items = response.data?.data || response.data || [];
    const itemArray = Array.isArray(items) ? items : [];
    return itemArray.length > 0 ? itemArray[0] : null;
  },

  /**
   * Search products by description or code using specific field mapping
   */
  async search(searchTerm: string, params?: QueryParams & { mode?: 'stockcode' | 'description1' | 'barcode' }): Promise<{ items: StockItem[], total: number }> {
    const { mode, ...queryParams } = params || {};

    // Map of mode to API parameter name
    const apiParams: any = {
      pageno: 1,
      recordsperpage: 50,
      ...queryParams,
    };

    if (mode === 'stockcode') {
      apiParams.stockcode = `like ${searchTerm}`;
    } else if (mode === 'description1') {
      apiParams.description1 = `like ${searchTerm}`;
    } else if (mode === 'barcode') {
      apiParams.barcode = `like ${searchTerm}`;
    } else {
      // Default: Search in both using the requested names
      apiParams.description1 = `like ${searchTerm}`;
      apiParams.stockcode = `like ${searchTerm}`;
    }

    const response = await httpClient.get<any>(ENDPOINTS.STOCK.MASTER, { params: apiParams });
    const rawData = response.data;
    let items: StockItem[] = [];

    if (Array.isArray(rawData)) {
      items = rawData;
    } else if (rawData && typeof rawData === 'object') {
      items = rawData.data || rawData.items || rawData.stock || rawData.stkmaster || [];
      if (!Array.isArray(items) && items && (items as any).data) {
        items = (items as any).data;
      }
    }

    if (!Array.isArray(items)) items = [];

    const total = response.total || (rawData && typeof rawData === 'object' ? (rawData.total || rawData.recordcount || rawData.total_records) : 0) || items.length;

    return {
      items,
      total: typeof total === 'number' ? total : 0
    };
  },

  /**
   * Search by barcode (main or alternative)
   */
  async searchByBarcode(barcode: string): Promise<StockItem | null> {
    // Try main barcode first
    let response = await httpClient.get<any>(ENDPOINTS.STOCK.MASTER, {
      params: { STKBARCODE: barcode }
    });

    let items = response.data?.data || response.data || [];
    let itemArray = Array.isArray(items) ? items : [];
    if (itemArray.length > 0) {
      return itemArray[0];
    }

    // Try alternative barcodes
    const altResponse = await httpClient.get<any>(ENDPOINTS.STOCK.ALT_BARCODES, {
      params: { BARCODE: barcode }
    });

    const altData = altResponse.data?.data || altResponse.data || [];
    const altBarcodes = Array.isArray(altData) ? altData : [];
    if (altBarcodes.length > 0) {
      return this.getByCode(altBarcodes[0].STKCODE);
    }

    return null;
  },

  /**
   * Create or update a product
   */
  async save(product: Partial<StockItem>): Promise<StockItem> {
    const response = await httpClient.post<StockItem>(ENDPOINTS.STOCK.MASTER, product);
    return response.data;
  },

  /**
   * Get products by category
   */
  async getByCategory(
    category1?: string,
    category2?: string,
    category3?: string,
    category4?: string
  ): Promise<StockItem[]> {
    const params: QueryParams = {};
    if (category1) params.STKCATEGORY1 = category1;
    if (category2) params.STKCATEGORY2 = category2;
    if (category3) params.STKCATEGORY3 = category3;
    if (category4) params.STKCATEGORY4 = category4;

    return this.getAll(params);
  },

  /**
   * Get products by department
   */
  async getByDepartment(departmentCode: string): Promise<StockItem[]> {
    return this.getAll({ STKDEPT: departmentCode });
  },

  /**
   * Get products needing reorder
   */
  async getReorderNeeded(): Promise<StockItem[]> {
    // This assumes your API supports custom filtering
    // You may need to implement this server-side
    const allProducts = await this.getAll({ STKACTIVE: 1 });
    return allProducts.filter(p =>
      (p.STKQTYAVAILABLE || 0) <= (p.STKREORDERPOINT || 0)
    );
  },
};

// ============================================
// Stock Balance Service
// ============================================

export const stockBalanceService = {
  /**
   * Get stock balance for a product across warehouses
   */
  async getBalance(stockCode: string, warehouseCode?: string): Promise<StockBalance[]> {
    const params: QueryParams = { STKCODE: stockCode };
    if (warehouseCode) params.WHCODE = warehouseCode;

    const response = await httpClient.get<any>(ENDPOINTS.STOCK.BALANCE, { params });
    const balances = response.data?.data || response.data || [];
    return Array.isArray(balances) ? balances : [];
  },

  /**
   * Get quantity on hand for multiple items
   */
  async getQuantityOnHand(stockCodes: string[], warehouseCode?: string): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    // Batch request - adjust based on your API capabilities
    for (const code of stockCodes) {
      const balances = await this.getBalance(code, warehouseCode);
      const total = balances.reduce((sum, b) => sum + (b.QTYONHAND || 0), 0);
      result.set(code, total);
    }

    return result;
  },
};

// ============================================
// Stock Pricing Service
// ============================================

export const pricingService = {
  /**
   * Get prices for a product
   */
  async getPrices(stockCode: string): Promise<StockPrice[]> {
    const response = await httpClient.get<any>(ENDPOINTS.STOCK.PRICE, {
      params: { STKCODE: stockCode }
    });
    const prices = response.data?.data || response.data || [];
    return Array.isArray(prices) ? prices : [];
  },

  /**
   * Get price for a specific price list
   */
  async getPriceForList(stockCode: string, priceList: string): Promise<number | null> {
    const prices = await this.getPrices(stockCode);
    const price = prices.find(p => p.PRICELIST === priceList);
    return price?.PRICE || null;
  },

  /**
   * Get detailed prices for multiple products by stock code
   * @param stockCodes - Array of stock codes
   * @param priceCode - The price level/code (default: '01')
   */
  async getDetailedPrices(stockCodes: string[], priceCode: string = '01'): Promise<DetailedStockPrice[]> {
    if (!stockCodes.length) return [];

    // API expects: stkprice?pricecode=01&stockcode=in('VAL1','VAL2')
    const stockCodeParams = `in(${stockCodes.map(code => `'${code}'`).join(',')})`;
    const response = await httpClient.get<any>(ENDPOINTS.STOCK.PRICE, {
      params: {
        pricecode: priceCode,
        stockcode: stockCodeParams,
        pageno: 1,
        recordsperpage: stockCodes.length
      }
    });

    const data = response.data?.data || response.data || [];
    return Array.isArray(data) ? data : [];
  },

  /**
   * Update prices
   */
  async updatePrice(priceData: Partial<StockPrice>): Promise<StockPrice> {
    const response = await httpClient.post<StockPrice>(ENDPOINTS.STOCK.PRICE, priceData);
    return response.data;
  },
};

// ============================================
// Alternative Barcodes Service
// ============================================

export const barcodeService = {
  /**
   * Get alternative barcodes for a product
   */
  async getAltBarcodes(stockCode: string): Promise<StockAltBarcode[]> {
    const response = await httpClient.get<any>(ENDPOINTS.STOCK.ALT_BARCODES, {
      params: { STKCODE: stockCode }
    });
    const barcodes = response.data?.data || response.data || [];
    return Array.isArray(barcodes) ? barcodes : [];
  },

  /**
   * Find product by any barcode
   */
  async findByBarcode(barcode: string): Promise<string | null> {
    const response = await httpClient.get<any>(ENDPOINTS.STOCK.ALT_BARCODES, {
      params: { BARCODE: barcode }
    });
    const barcodes = response.data?.data || response.data || [];
    const barcodeArray = Array.isArray(barcodes) ? barcodes : [];
    return barcodeArray.length > 0 ? barcodeArray[0].STKCODE : null;
  },

  /**
   * Add alternative barcode
   */
  async addBarcode(data: StockAltBarcode): Promise<StockAltBarcode> {
    const response = await httpClient.post<StockAltBarcode>(ENDPOINTS.STOCK.ALT_BARCODES, data);
    return response.data;
  },
};

// ============================================
// Category Service
// ============================================

export const categoryService = {
  /**
   * Get all categories for a level
   */
  async getCategories(level: 1 | 2 | 3 | 4): Promise<Category[]> {
    const endpoints = {
      1: ENDPOINTS.CATEGORIES.LEVEL1,
      2: ENDPOINTS.CATEGORIES.LEVEL2,
      3: ENDPOINTS.CATEGORIES.LEVEL3,
      4: ENDPOINTS.CATEGORIES.LEVEL4,
    };

    const response = await httpClient.get<any>(endpoints[level]);
    const categories = response.data?.data || response.data || [];
    return Array.isArray(categories) ? categories : [];
  },

  /**
   * Get all category levels
   */
  async getAllCategories(): Promise<{
    level1: Category[];
    level2: Category[];
    level3: Category[];
    level4: Category[];
  }> {
    const [level1, level2, level3, level4] = await Promise.all([
      this.getCategories(1),
      this.getCategories(2),
      this.getCategories(3),
      this.getCategories(4),
    ]);

    return { level1, level2, level3, level4 };
  },
};

// ============================================
// Batch Service
// ============================================

export const batchService = {
  /**
   * Get batches for a product
   */
  async getBatches(stockCode: string): Promise<StockBatch[]> {
    const response = await httpClient.get<any>(ENDPOINTS.STOCK.BATCHES, {
      params: { STKCODE: stockCode }
    });
    const batches = response.data?.data || response.data || [];
    return Array.isArray(batches) ? batches : [];
  },

  /**
   * Create/update batch
   */
  async saveBatch(batch: Partial<StockBatch>): Promise<StockBatch> {
    const response = await httpClient.post<StockBatch>(ENDPOINTS.STOCK.BATCHES, batch);
    return response.data;
  },
};

// ============================================
// Variant Service
// ============================================

export const variantService = {
  /**
   * Get variants for a product
   */
  async getVariants(stockCode: string): Promise<StockVariant[]> {
    const response = await httpClient.get<any>(ENDPOINTS.STOCK.VARIANTS, {
      params: { STKCODE: stockCode }
    });
    const variants = response.data?.data || response.data || [];
    return Array.isArray(variants) ? variants : [];
  },

  /**
   * Create/update variant
   */
  async saveVariant(variant: Partial<StockVariant>): Promise<StockVariant> {
    const response = await httpClient.post<StockVariant>(ENDPOINTS.STOCK.VARIANTS, variant);
    return response.data;
  },
};

// ============================================
// Export all as unified API
// ============================================

export const stockApi = {
  products: productService,
  balance: stockBalanceService,
  pricing: pricingService,
  barcodes: barcodeService,
  categories: categoryService,
  batches: batchService,
  variants: variantService,
};

export default stockApi;
