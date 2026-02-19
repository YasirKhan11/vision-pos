/**
 * Vision API Sales/Order Service
 * 
 * Handles all sales and order related operations:
 * - Orders (ORDHEADER, ORDDETAILS)
 * - Invoices (DOCHEADER)
 * - Quotes
 * - POS transactions
 */

import { ENDPOINTS } from './config';
import { httpClient } from './httpClient';
import { authService } from './authService';
import type {
  OrderHeader,
  OrderDetail,
  CreateOrderRequest,
  Invoice,
  POSSale,
  POSSaleItem,
  POSSaleTotals,
  PaymentLine,
  QueryParams
} from '../types/api.types';

// ============================================
// Order Service
// ============================================

export const orderService = {
  /**
   * Get all orders with optional filtering
   */
  async getAll(params?: QueryParams): Promise<OrderHeader[]> {
    const response = await httpClient.get<any>(ENDPOINTS.ORDER.HEADER, { params });
    const orders = response.data?.data || response.data || [];
    return Array.isArray(orders) ? orders : [];
  },

  /**
   * Get a single order by order number
   */
  async getByNumber(orderNumber: string): Promise<OrderHeader | null> {
    const response = await httpClient.get<any>(ENDPOINTS.ORDER.HEADER, {
      params: { ORDNO: orderNumber }
    });
    const orders = response.data?.data || response.data || [];
    const orderArray = Array.isArray(orders) ? orders : [];
    return orderArray.length > 0 ? orderArray[0] : null;
  },

  /**
   * Get order details (line items)
   */
  async getDetails(orderNumber: string): Promise<OrderDetail[]> {
    const response = await httpClient.get<any>(ENDPOINTS.ORDER.DETAILS, {
      params: { ORDNO: orderNumber }
    });
    const details = response.data?.data || response.data || [];
    return Array.isArray(details) ? details : [];
  },

  /**
   * Get complete order with header and details
   */
  async getFullOrder(orderNumber: string): Promise<{ header: OrderHeader; details: OrderDetail[] } | null> {
    const header = await this.getByNumber(orderNumber);
    if (!header) return null;

    const details = await this.getDetails(orderNumber);
    return { header, details };
  },

  /**
   * Create a new order (complete with details)
   * Uses POST /order endpoint
   */
  async create(order: CreateOrderRequest): Promise<OrderHeader> {
    const response = await httpClient.post<OrderHeader>(ENDPOINTS.ORDER.CREATE, order);
    return response.data;
  },

  /**
   * Update an existing order
   */
  async update(orderNumber: string, order: Partial<CreateOrderRequest>): Promise<OrderHeader> {
    const response = await httpClient.put<OrderHeader>(ENDPOINTS.ORDER.CREATE, {
      ORDNO: orderNumber,
      ...order,
    });
    return response.data;
  },

  /**
   * Delete an order
   */
  async delete(orderNumber: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.ORDER.HEADER, {
      params: { ORDNO: orderNumber }
    });
  },

  /**
   * Delete an order detail line
   */
  async deleteDetail(orderNumber: string, lineNumber: number): Promise<void> {
    await httpClient.delete(ENDPOINTS.ORDER.DETAILS, {
      params: { ORDNO: orderNumber, ORDLINENO: lineNumber }
    });
  },

  /**
   * Get orders by customer
   */
  async getByCustomer(customerCode: string): Promise<OrderHeader[]> {
    return this.getAll({ Account: customerCode });
  },

  /**
   * Get orders by status
   */
  async getByStatus(status: string): Promise<OrderHeader[]> {
    return this.getAll({ ORDSTATUS: status });
  },

  /**
   * Get orders by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<OrderHeader[]> {
    // Date filtering depends on your API implementation
    // This is a basic example - adjust as needed
    return this.getAll({
      ORDDATE: `>=${startDate}`,
      // You may need to handle date ranges differently
    });
  },

  /**
   * Get today's orders
   */
  async getTodaysOrders(): Promise<OrderHeader[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAll({ ORDDATE: today });
  },
};

// ============================================
// Quote Service
// ============================================

export const quoteService = {
  /**
   * Create a quote
   */
  async create(quote: CreateOrderRequest): Promise<OrderHeader> {
    const response = await httpClient.post<OrderHeader>(ENDPOINTS.ORDER.QUOTE, quote);
    return response.data;
  },

  /**
   * Get all quotes
   */
  async getAll(): Promise<OrderHeader[]> {
    return orderService.getAll({ ORDTYPE: 'QUOTE' });
  },

  /**
   * Convert quote to order
   */
  async convertToOrder(quoteNumber: string): Promise<OrderHeader> {
    const quote = await orderService.getFullOrder(quoteNumber);
    if (!quote) {
      throw new Error('Quote not found');
    }

    // Create new order from quote
    const order = await orderService.create({
      header: {
        ...quote.header,
        ORDTYPE: 'SALE',
        ORDSTATUS: 'NEW',
      },
      details: quote.details,
    });

    return order;
  },
};

// ============================================
// Invoice Service
// ============================================

export const invoiceService = {
  /**
   * Get all invoices
   */
  async getAll(params?: QueryParams): Promise<Invoice[]> {
    const response = await httpClient.get<any>(ENDPOINTS.INVOICE.LIST, { params });
    const invoices = response.data?.data || response.data || [];
    return Array.isArray(invoices) ? invoices : [];
  },

  /**
   * Get filtered invoices for lookup (Specialized)
   */
  async listFilteredInvoices(account: string, txtp?: string, pageno: number = 1, docno?: string): Promise<any[]> {
    const settings = authService.getCurrentUserSettings();
    const params: any = {
      selectlist: 'Co,branch,docno,txtp,account,trandate',
      detailselectlist: 'stockcode,tillno,account,description1,quantity,price,priceincl,priceexcl',
      pageno: pageno,
      recordsperpage: 100,
      account: account,
      status: 'A',
      CO: settings?.defco || '01',
      BRANCH: settings?.defbranch || '01'
    };

    if (txtp) {
      params.txtp = txtp;
    }

    if (docno) {
      params.docno = docno;
    }

    const response = await httpClient.get<any>(ENDPOINTS.INVOICE.LIST, { params });
    const data = response.data;
    // Standard response structure is wrapped in data property
    return data?.data || data || [];
  },

  /**
   * Create an invoice
   */
  async create(invoice: any): Promise<any> {
    const response = await httpClient.post<any>(ENDPOINTS.INVOICE.CREATE, invoice);
    return response.data;
  },

  /**
   * Get invoices by customer
   */
  async getByCustomer(customerCode: string): Promise<Invoice[]> {
    return this.getAll({ DOCCUSTCODE: customerCode });
  },

  /**
   * Get unpaid invoices
   */
  async getUnpaid(): Promise<Invoice[]> {
    const invoices = await this.getAll({ DOCTYPE: 'INVOICE' });
    return invoices.filter(inv =>
      inv.DOCSTATUS !== 'PAID' && inv.DOCSTATUS !== 'CANCELLED'
    );
  },

  /**
   * Get order/invoice details (line items) using invoicelist endpoint
   */
  async getOrderDetails(docno: string, pageno: number = 1, recordsperpage: number = 50): Promise<any[]> {
    const settings = authService.getCurrentUserSettings();
    const params: any = {
      selectlist: 'Co,branch,docno,txtp,account,trandate',
      detailselectlist: 'stockcode,tillno,account,description1,quantity,price,priceincl,priceexcl',
      pageno,
      recordsperpage,
      docno,
      CO: settings?.defco || '01',
      BRANCH: settings?.defbranch || '01'
    };

    const response = await httpClient.get<any>(ENDPOINTS.INVOICE.LIST, { params });
    const data = response.data;
    const invoices = data?.data || data || [];

    if (invoices.length > 0) {
      // Line items are in 'orderdetails' or 'detailselectlist' as per user schema
      const firstInvoice = invoices[0];
      const items = firstInvoice.orderdetails || firstInvoice.detailselectlist || [];
      return Array.isArray(items) ? items : [];
    }
    return [];
  },

  /**
   * Get an unallocated return number from system numbers
   */
  async getUnallocatedNumber(): Promise<number | null> {
    const settings = authService.getCurrentUserSettings();
    const params = {
      pageno: 1,
      recordsperpage: 5,
      modcode: 'POS',
      txtp: 'MODUNA',
      CO: settings?.defco || '01',
      BRANCH: settings?.defbranch || '01'
    };

    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.NUMBERS, { params });
    const data = response.data;
    const records = data?.data?.data || data?.data || [];

    if (records.length > 0) {
      return records[0].number || null;
    }
    return null;
  }
};

// ============================================
// POS Sale Service (Frontend helper)
// ============================================

export const posService = {
  /**
   * Calculate sale totals from items
   */
  calculateTotals(items: POSSaleItem[]): POSSaleTotals {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalVAT = 0;
    let totalQuantity = 0;

    items.forEach(item => {
      const lineSubtotal = item.price * item.quantity;
      let lineDiscount = 0;

      if (item.discountType === 'P') {
        lineDiscount = lineSubtotal * (item.discount / 100);
      } else {
        lineDiscount = item.discount;
      }

      const lineAfterDiscount = lineSubtotal - lineDiscount;
      const lineVAT = lineAfterDiscount * (item.vatRate / 100);

      subTotal += lineSubtotal;
      totalDiscount += lineDiscount;
      totalVAT += lineVAT;
      totalQuantity += item.quantity;
    });

    return {
      subTotal,
      totalDiscount,
      totalVAT,
      grandTotal: subTotal - totalDiscount + totalVAT,
      totalItems: items.length,
      totalQuantity,
    };
  },

  /**
   * Convert POS sale to order request
   */
  convertToOrderRequest(sale: POSSale): CreateOrderRequest {
    const totals = this.calculateTotals(sale.items);

    const header: CreateOrderRequest['header'] = {
      ORDDATE: new Date().toISOString(),
      ORDCUSTCODE: sale.customer?.DEBCODE || 'CASH',
      ORDCUSTNAME: sale.customer?.DEBNAME,
      ORDSTATUS: 'NEW',
      ORDTYPE: sale.type,
      ORDTOTAL: totals.grandTotal,
      ORDVAT: totals.totalVAT,
      ORDDISCOUNT: totals.totalDiscount,
      ORDNETTOTAL: totals.grandTotal,
      ORDBRANCHCODE: sale.branchCode,
      ORDWHCODE: sale.warehouseCode,
      ORDSALESREP: sale.salesRepCode,
      ORDREFERENCE: sale.reference,
      ORDNOTES: sale.notes,
    };

    const details: CreateOrderRequest['details'] = sale.items.map((item, index) => ({
      ORDLINENO: index + 1,
      ORDSTKCODE: item.stockCode,
      ORDDESC: item.description,
      ORDQTY: item.quantity,
      ORDPRICE: item.price,
      ORDDISCOUNT: item.discount,
      ORDDISCTYPE: item.discountType,
      ORDLINETOTAL: this.calculateLineTotal(item),
      ORDVATRATE: item.vatRate,
      ORDSERIAL: item.serialNumber,
      ORDBATCHNO: item.batchNumber,
    }));

    return { header, details };
  },

  /**
   * Calculate line total for a single item
   */
  calculateLineTotal(item: POSSaleItem): number {
    const subtotal = item.price * item.quantity;
    let discount = 0;

    if (item.discountType === 'P') {
      discount = subtotal * (item.discount / 100);
    } else {
      discount = item.discount;
    }

    return subtotal - discount;
  },

  /**
   * Process a complete POS sale
   */
  async processSale(sale: POSSale): Promise<OrderHeader> {
    const orderRequest = this.convertToOrderRequest(sale);
    return orderService.create(orderRequest);
  },

  /**
   * Validate sale before processing
   */
  validateSale(sale: POSSale): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (sale.items.length === 0) {
      errors.push('No items in sale');
    }

    sale.items.forEach((item, index) => {
      if (!item.stockCode) {
        errors.push(`Line ${index + 1}: Stock code is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Line ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.price < 0) {
        errors.push(`Line ${index + 1}: Price cannot be negative`);
      }
    });

    // Validate payments total if provided
    if (sale.payments && sale.payments.length > 0) {
      const totals = this.calculateTotals(sale.items);
      const paymentTotal = sale.payments.reduce((sum, p) => sum + p.AMOUNT, 0);

      if (Math.abs(paymentTotal - totals.grandTotal) > 0.01) {
        errors.push('Payment total does not match sale total');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// ============================================
// Export all as unified API
// ============================================

export const salesApi = {
  orders: orderService,
  quotes: quoteService,
  invoices: invoiceService,
  pos: posService,
};

export default salesApi;
