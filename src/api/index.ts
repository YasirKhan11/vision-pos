/**
 * Vision ERP/POS Gateway API Client
 * 
 * Main entry point for all API services.
 * 
 * @example
 * import { api } from './api';
 * 
 * // Login
 * await api.auth.login({ username: 'user', password: 'pass' });
 * 
 * // Get products
 * const products = await api.products.getAll();
 * 
 * // Search customers
 * const customers = await api.customers.search('John');
 * 
 * // Create order
 * const order = await api.sales.orders.create(orderData);
 */

// Configuration
export { API_CONFIG, ENDPOINTS, ACCESS_CODES } from './config';

// HTTP Client & Utilities
export { httpClient, tokenManager, HttpError } from './httpClient';
export type { RequestOptions } from './httpClient';

// Services
export { authService } from './authService';
export {
  productService,
  stockBalanceService,
  pricingService,
  barcodeService,
  categoryService,
  batchService,
  variantService,
  stockApi
} from './productService';
export {
  customerService,
  customerContactService,
  customerAddressService,
  customerApi
} from './customerService';
export {
  orderService,
  quoteService,
  invoiceService,
  posService,
  salesApi
} from './salesService';
export {
  branchService,
  warehouseService,
  tenderService,
  departmentService,
  salesRepService,
  parameterService,
  userService,
  versionService,
  systemCache,
  systemApi
} from './systemService';

// Types
export * from '../types/api.types';

// ============================================
// Unified API Object
// ============================================

import { authService } from './authService';
import { stockApi } from './productService';
import { customerApi } from './customerService';
import { salesApi } from './salesService';
import { systemApi } from './systemService';

/**
 * Unified API client with all services
 */
export const api = {
  // Authentication
  auth: authService,

  // Products/Stock
  products: stockApi.products,
  stock: stockApi,

  // Customers
  customers: customerApi.customers,
  customerApi: customerApi,

  // Sales/Orders
  sales: salesApi,
  orders: salesApi.orders,
  invoices: salesApi.invoices,
  pos: salesApi.pos,

  // Users
  users: systemApi.users,


  // System
  system: systemApi,
  branches: systemApi.branches,
  warehouses: systemApi.warehouses,
  tenders: systemApi.tenders,
  departments: systemApi.departments,
  salesReps: systemApi.salesReps,
  parameters: systemApi.parameters,
};

export default api;
