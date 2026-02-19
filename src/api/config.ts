/**
 * Vision ERP/POS Gateway API Configuration
 * 
 * Configure these settings for your environment.
 * For development, you can use environment variables or modify directly.
 */

export const API_CONFIG = {
  // Base URL of your Vision Gateway API
  // In production, we force usage of the '/api' proxy to avoid Mixed Content errors on HTTPS hosts like Vercel.
  BASE_URL: import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://156.38.165.18:8181'),

  // JWT Token settings
  TOKEN_KEY: 'vision_jwt_token',
  TOKEN_REFRESH_KEY: 'vision_jwt_refresh',
  TOKEN_EXPIRY_KEY: 'vision_token_expiry',
  USER_SETTINGS_KEY: 'vision_user_settings',

  // Token validity (from API docs: 3 hours)
  TOKEN_VALIDITY_MS: 3 * 60 * 60 * 1000, // 3 hours in milliseconds

  // Refresh token before expiry (refresh 10 minutes before expiry)
  TOKEN_REFRESH_THRESHOLD_MS: 10 * 60 * 1000, // 10 minutes

  // Request timeout (increased for slow networks)
  REQUEST_TIMEOUT_MS: 60000, // 60 seconds

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 500,

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
};

/**
 * API Endpoints
 * All endpoints as documented in Vision ERP/POS Gateway API
 */
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/login',
    REFRESH_TOKEN: '/refreshtoken',
  },

  // Health & Test
  HEALTH: {
    ROOT: '/',
    TEST: '/Test',
    VERSION: '/sysversion',
  },

  // Stock/Inventory Management
  STOCK: {
    MASTER: '/stkmaster',
    BALANCE: '/stkbalance',
    QUANTITY_ON_HAND: '/stkquantityonhand',
    PRICE: '/stkprice',
    ALT_BARCODES: '/stkaltbarcodes',
    BATCHES: '/stkstbatch',
    VARIANTS: '/stkvariant',
    COUNTS: '/stkstcounts',
    SAVE_COUNTS: '/savestkstcounts',
    UPDATE_COUNTS: '/updatestkstcounts',
    // Sync endpoints
    PULL_MASTER: '/pull/stkmasterlist',
    SYNC_MASTER: '/sync/stkmasterlist',
    PULL_PRICES: '/pull/stkpricelist',
    SYNC_PRICES: '/sync/stkpricelist',
  },

  // Categories
  CATEGORIES: {
    LEVEL1: '/category1',
    LEVEL2: '/category2',
    LEVEL3: '/category3',
    LEVEL4: '/category4',
  },

  // Customer (Debtor) Management
  CUSTOMER: {
    MASTER: '/debmaster',
    CONTACTS: '/debcontacts',
    ADDRESSES: '/debmaddress',
  },

  // Order Management
  ORDER: {
    HEADER: '/ordheader',
    DETAILS: '/orddetails',
    CREATE: '/order',
    CRM: '/ordcrm',
    QUOTE: '/quote',
  },

  // Invoicing & Documents
  INVOICE: {
    LIST: '/invoicelist',
    CREATE: '/invoice',
    HO_DETAILS: '/hoinvoicedet',
  },

  // Stock Documents
  STOCK_DOC: {
    HEADER: '/stkdochdr',
  },

  // GRV (Goods Receiving)
  GRV: {
    INVOICE: '/grvinvoice',
    AP_RESERVE: '/apreserveinvoice',
  },

  // Purchase Orders
  PURCHASE: {
    HEADER: '/purordhdr',
  },

  // Transfers & Shipments
  TRANSFER: {
    LIST: '/transfer',
    PULL: '/pull/transferlist',
  },
  SHIPMENT: {
    HEADER: '/shipmenthdr',
    DETAILS: '/shipmentdet',
    CREATE: '/shipment',
  },

  // System Administration
  SYSTEM: {
    USERS: '/users',
    BRANCHES: '/sysbranch',
    WAREHOUSES: '/syswh',
    BIN_LOCATIONS: '/stkbinloc',
    USER_FORMS: '/sysuserforms',
    GROUP_ACCESS: '/sysgrpaccess',
    USER_ACCESS: '/sysuseraccess',
    SALES_REPS: '/syssalesreps',
    TENDERS: '/systender',
    DEPARTMENTS: '/stkdept',
    PARAMETERS: '/sysparameter',
    NUMBERS: '/sysnumbers',
  },

  // Logging
  LOG: {
    WAG: '/waglog',
    SERVER_TRIGGER: '/svrtrig',
  },
};

/**
 * Access Codes for permission checks
 */
export const ACCESS_CODES = {
  INVOICE: 2,
  ORDER: 22,
  QUOTE: 23,
};

export default API_CONFIG;
