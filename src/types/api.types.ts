/**
 * Vision ERP/POS Gateway API Types
 * 
 * TypeScript interfaces matching the Vision database schema
 * and API request/response formats.
 */

// ============================================
// API Response Types
// ============================================

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T = any> {
  status: number;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  status: number;
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}

/**
 * API Error response
 */
export interface ApiError {
  status: number;
  message: string;
  details?: string;
}

// ============================================
// Authentication Types
// ============================================

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface PickerLoginCredentials {
  PickerCardNo: string;
}

export interface AuthResponse {
  token: string;
  expiresAt?: string;
  user?: UserInfo;
}

export interface UserSettings {
  recid: number;
  defco: string;
  defbranch: string;
  defsalesrep: string;
  defaccount: string;
  deftillno: string;
}

export interface UserInfo {
  username: string;
  userId?: string;
  branchCode?: string;
  permissions?: string[];
}

// ============================================
// Stock/Product Types (STKMASTER)
// ============================================

export interface StockItem {
  STKCODE: string;           // Stock code (Primary Key)
  STKDESC: string;           // Description
  STKDESC2?: string;         // Description line 2
  STKBARCODE?: string;       // Main barcode
  STKPRICE1?: number;        // Price level 1 (Retail)
  STKPRICE2?: number;        // Price level 2 (Wholesale)
  STKPRICE3?: number;        // Price level 3
  STKPRICE4?: number;        // Price level 4
  STKPRICE5?: number;        // Price level 5
  STKCOSTPRICE?: number;     // Cost price
  STKVATCODE?: string;       // VAT code
  STKVATRATE?: number;       // VAT rate percentage
  STKDEPT?: string;          // Department code
  STKCATEGORY1?: string;     // Category level 1
  STKCATEGORY2?: string;     // Category level 2
  STKCATEGORY3?: string;     // Category level 3
  STKCATEGORY4?: string;     // Category level 4
  STKQTYONHAND?: number;     // Quantity on hand
  STKQTYALLOCATED?: number;  // Quantity allocated
  STKQTYAVAILABLE?: number;  // Quantity available
  STKQTYONORDER?: number;    // Quantity on order
  STKREORDERPOINT?: number;  // Reorder point
  STKREORDERQTY?: number;    // Reorder quantity
  STKUNITOFMEASURE?: string; // Unit of measure
  STKWEIGHT?: number;        // Weight
  STKACTIVE?: boolean;       // Active status
  STKIMAGE?: string;         // Image path/URL
  STKCREATEDDATE?: string;   // Created date
  STKMODIFIEDDATE?: string;  // Modified date
  STKBINLOCATION?: string;   // Bin/shelf location
  STKSUPPLIERCODE?: string;  // Primary supplier
  STKSERIAL?: boolean;       // Requires serial number
  STKBATCH?: boolean;        // Requires batch tracking
  STKLINKCODE?: string;      // Link code for pricing
}

export interface DetailedStockPrice {
  stockcode: string;
  linkcode: string;
  pricecode: string;
  description: string;
  excl: number;
  incl: number;
  pricerule: string;
}

export interface StockPrice {
  STKCODE: string;
  PRICELIST: string;
  PRICE: number;
  STARTDATE?: string;
  ENDDATE?: string;
  MINQTY?: number;
  MAXQTY?: number;
}

export interface StockAltBarcode {
  STKCODE: string;
  BARCODE: string;
  QTYMULTIPLIER?: number;
  DESCRIPTION?: string;
}

export interface StockBalance {
  STKCODE: string;
  WHCODE: string;
  BINLOC?: string;
  QTYONHAND: number;
  QTYALLOCATED: number;
  QTYAVAILABLE: number;
}

export interface StockBatch {
  STKCODE: string;
  BATCHNO: string;
  EXPIRYDATE?: string;
  QTYONHAND: number;
  COSTPRICE?: number;
}

export interface StockVariant {
  STKCODE: string;
  VARIANTCODE: string;
  VARIANTDESC: string;
  VARIANTTYPE: string; // e.g., 'SIZE', 'COLOR'
  PRICE?: number;
  QTYONHAND?: number;
}

// ============================================
// Category Types
// ============================================

export interface Category {
  CODE: string;
  DESCRIPTION: string;
  PARENTCODE?: string;
  SORTORDER?: number;
  ACTIVE?: boolean;
}

// ============================================
// Customer/Debtor Types (DEBMASTER)
// ============================================

export interface Customer {
  DEBCODE: string;           // Customer code (Primary Key)
  DEBNAME: string;           // Customer name
  DEBNAME2?: string;         // Name line 2
  DEBADDR1?: string;         // Address line 1
  DEBADDR2?: string;         // Address line 2
  DEBADDR3?: string;         // Address line 3
  DEBADDR4?: string;         // City
  DEBPOSTCODE?: string;      // Postal code
  DEBCOUNTRY?: string;       // Country
  DEBPHONE?: string;         // Phone number
  DEBPHONE2?: string;        // Phone number 2
  DEBCELLPHONE?: string;     // Cell phone number
  DEBFAX?: string;           // Fax number
  DEBEMAIL?: string;         // Email address
  DEBCONTACT?: string;       // Contact person
  DEBCREDITLIMIT?: number;   // Credit limit
  DEBBALANCE?: number;       // Current balance
  DEBPRICELEVEL?: number;    // Price level (1-5)
  DEBDISCPERCENT?: number;   // Discount percentage
  DEBVATNO?: string;         // VAT registration number
  DEBTERMS?: number;         // Payment terms (days)
  DEBSALESREP?: string;      // Sales rep code
  DEBCATEGORY?: string;      // Customer category
  DEBACTIVE?: boolean;       // Active status
  DEBLOYALTYPOINTS?: number; // Loyalty points balance
  DEBCREATEDDATE?: string;   // Created date
  DEBMODIFIEDDATE?: string;  // Modified date
  DEBNOTES?: string;         // Notes
  DEBBRANCHCODE?: string;    // Branch code
}

export interface CustomerContact {
  DEBCODE: string;
  CONTACTID: number;
  CONTACTNAME: string;
  POSITION?: string;
  PHONE?: string;
  MOBILE?: string;
  EMAIL?: string;
  ISPRIMARY?: boolean;
}

export interface CustomerAddress {
  DEBCODE: string;
  ADDRESSID: number;
  ADDRESSTYPE: string; // 'DELIVERY', 'BILLING'
  ADDR1?: string;
  ADDR2?: string;
  ADDR3?: string;
  CITY?: string;
  POSTCODE?: string;
  COUNTRY?: string;
  ISDEFAULT?: boolean;
}

// ============================================
// Order Types (ORDHEADER, ORDDETAILS)
// ============================================

export interface OrderHeader {
  ORDNO: string;             // Order number (Primary Key)
  ORDDATE: string;           // Order date
  ORDCUSTCODE: string;       // Customer code
  ORDCUSTNAME?: string;      // Customer name
  ORDSTATUS: OrderStatus;    // Order status
  ORDTYPE: OrderType;        // Order type
  ORDTOTAL?: number;         // Order total
  ORDVAT?: number;           // VAT amount
  ORDDISCOUNT?: number;      // Discount amount
  ORDNETTOTAL?: number;      // Net total
  ORDBRANCHCODE?: string;    // Branch code
  ORDWHCODE?: string;        // Warehouse code
  ORDSALESREP?: string;      // Sales rep code
  ORDREFERENCE?: string;     // Reference number
  ORDREF?: string;           // Legacy Reference Alias
  ORDNOTES?: string;         // Notes
  ORDCREATEDBY?: string;     // Created by user
  ORDCREATEDDATE?: string;   // Created date
  ORDMODIFIEDBY?: string;    // Modified by user
  ORDMODIFIEDDATE?: string;  // Modified date
  ORDDELIVERYADDR?: string;  // Delivery address
  ORDDELIVERYDATE?: string;  // Requested delivery date
  ORDDUEDATE?: string;       // Due date
  TXTP?: string;             // Transaction Type (DEBSOR, DEBQOT)
}

export interface OrderDetail {
  ORDNO: string;             // Order number
  ORDLINENO: number;         // Line number
  ORDSTKCODE: string;        // Stock code
  ORDDESC: string;           // Description
  ORDQTY: number;            // Quantity
  ORDPRICE: number;          // Unit price
  ORDDISCOUNT?: number;      // Discount amount/percent
  ORDDISCTYPE?: 'P' | 'V';   // Discount type: P=Percentage, V=Value
  ORDLINETOTAL: number;      // Line total
  ORDVATCODE?: string;       // VAT code
  ORDVATRATE?: number;       // VAT rate
  ORDVATAMT?: number;        // VAT amount
  ORDWHCODE?: string;        // Warehouse code
  ORDCOSTPRICE?: number;     // Cost price
  ORDSERIAL?: string;        // Serial number (if applicable)
  ORDBATCHNO?: string;       // Batch number (if applicable)
}

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'INVOICED'
  | 'CANCELLED'
  | 'ON_HOLD'
  | 'O' | 'A' | 'I' | 'B' | 'C' | 'X'; // Heritage codes (Open, Active/Authorized, Invoiced, BackOrder, Cancelled, etc.)

export type OrderType =
  | 'SALE'
  | 'RETURN'
  | 'QUOTE'
  | 'LAYBY'
  | 'BACKORDER'
  | 'S' | 'R' | 'Q' | 'L' | 'B'; // Heritage codes

/**
 * Complete order with header and details for creation
 */
export interface CreateOrderRequest {
  header: Omit<OrderHeader, 'ORDNO' | 'ORDCREATEDDATE' | 'ORDMODIFIEDDATE'>;
  details: Omit<OrderDetail, 'ORDNO'>[];
  payments?: any[];
}

// ============================================
// Invoice Types (DOCHEADER)
// ============================================

export interface Invoice {
  DOCNO: string;             // Document number
  DOCTYPE: DocumentType;     // Document type
  DOCDATE: string;           // Document date
  DOCCUSTCODE: string;       // Customer code
  DOCCUSTNAME?: string;      // Customer name
  DOCTOTAL: number;          // Total amount
  DOCVAT: number;            // VAT amount
  DOCDISCOUNT?: number;      // Discount amount
  DOCNETTOTAL: number;       // Net total
  DOCPAID?: number;          // Amount paid
  DOCBALANCE?: number;       // Balance due
  DOCSTATUS: InvoiceStatus;  // Document status
  DOCBRANCHCODE?: string;    // Branch code
  DOCORDNO?: string;         // Linked order number
  DOCREFERENCE?: string;     // Reference
  DOCNOTES?: string;         // Notes
  DOCCREATEDBY?: string;     // Created by
  DOCCREATEDDATE?: string;   // Created date
}

export type DocumentType =
  | 'INVOICE'
  | 'CREDIT_NOTE'
  | 'QUOTE'
  | 'DELIVERY_NOTE';

export type InvoiceStatus =
  | 'DRAFT'
  | 'POSTED'
  | 'PAID'
  | 'PARTIAL'
  | 'CANCELLED';

// ============================================
// Payment/Tender Types
// ============================================

export interface TenderType {
  TENDERCODE: string;
  TENDERDESC: string;
  TENDERTYPE: PaymentMethod;
  OPENSCASHDRAWER?: boolean;
  REQUIRESREF?: boolean;
  ACTIVE?: boolean;
}

export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'EFT'
  | 'CHEQUE'
  | 'VOUCHER'
  | 'ACCOUNT'
  | 'LOYALTY';

export interface PaymentLine {
  TENDERCODE: string;
  AMOUNT: number;
  REFERENCE?: string;
  CHANGEDUE?: number;
}

// ============================================
// System Types
// ============================================

export interface Branch {
  BRANCHCODE: string;
  BRANCHNAME: string;
  ADDRESS1?: string;
  ADDRESS2?: string;
  CITY?: string;
  PHONE?: string;
  EMAIL?: string;
  ACTIVE?: boolean;
}

export interface Warehouse {
  WHCODE: string;
  WHDESC: string;
  BRANCHCODE?: string;
  ADDRESS?: string;
  ACTIVE?: boolean;
}

export interface BinLocation {
  BINCODE: string;
  BINDESC: string;
  WHCODE: string;
  ZONE?: string;
  AISLE?: string;
  RACK?: string;
  LEVEL?: string;
}

export interface Department {
  DEPTCODE: string;
  DEPTDESC: string;
  ACTIVE?: boolean;
}

export interface SalesRep {
  REPCODE: string;
  REPNAME: string;
  PHONE?: string;
  EMAIL?: string;
  COMMISSION?: number;
  ACTIVE?: boolean;
}

export interface SystemParameter {
  PARAMCODE: string;
  PARAMVALUE: string;
  PARAMDESC?: string;
  PARAMTYPE?: string;
}

export interface SystemVersion {
  VERSION: string;
  BUILDDATE?: string;
  DATABASE?: string;
}

// ============================================
// Query Parameters
// ============================================

export interface QueryParams {
  pageno?: number;
  recordsperpage?: number;
  orderby?: string;
  nativejson?: boolean;
  includemeta?: boolean;
  selectlist?: string;
  recid?: string | number;
  [key: string]: any; // Allow any column name as filter
}

// ============================================
// Transfer & Shipment Types
// ============================================

export interface StockTransfer {
  TRANSFERNO: string;
  TRANSFERDATE: string;
  FROMWHCODE: string;
  TOWHCODE: string;
  STATUS: TransferStatus;
  CREATEDBY?: string;
  NOTES?: string;
}

export type TransferStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'CANCELLED';

export interface Shipment {
  SHIPMENTNO: string;
  SHIPMENTDATE: string;
  ORDNO?: string;
  CUSTCODE?: string;
  STATUS: ShipmentStatus;
  TRACKINGNO?: string;
  CARRIER?: string;
}

export type ShipmentStatus =
  | 'PENDING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RETURNED';

// ============================================
// POS Sale Types (Frontend specific)
// ============================================

/**
 * POS Sale - combines order creation with payment
 */
export interface POSSale {
  customer: Customer | null;
  items: POSSaleItem[];
  payments: PaymentLine[];
  type: 'SALE' | 'RETURN' | 'QUOTE' | 'LAYBY';
  branchCode?: string;
  warehouseCode?: string;
  salesRepCode?: string;
  reference?: string;
  notes?: string;
}

export interface POSSaleItem {
  stockCode: string;
  description: string;
  quantity: number;
  price: number;
  discount: number;
  discountType: 'P' | 'V';
  vatRate: number;
  serialNumber?: string;
  batchNumber?: string;
}

/**
 * POS Sale totals
 */
export interface POSSaleTotals {
  subTotal: number;
  totalDiscount: number;
  totalVAT: number;
  grandTotal: number;
  totalItems: number;
  totalQuantity: number;
}
