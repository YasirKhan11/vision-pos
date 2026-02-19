export interface CustomerInsights {
    lastVisit: string; // ISO date
    daysSinceLastVisit: number;
    totalTransactions: number;
    totalSpend: number;
    averageBasket: number;
    rfmSegment: 'Champion' | 'Loyal' | 'Potential' | 'At Risk' | 'Lost' | 'New';
    topProducts: string[]; // Product IDs frequently purchased
    purchaseFrequency: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Occasional';
}

export interface LoyaltyInfo {
    pointsBalance: number;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    tierProgress: number; // Percentage to next tier
    pointsToNextTier: number;
    memberSince: string;
    lifetimePoints: number;
    pendingRewards: number; // Redeemable value in Rands
}

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
    phone2?: string;
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
    priceCategory?: string;
    balance?: number;
    branch?: string;
    vatIndicator?: string;
    [key: string]: any; // Allow raw API fields for grid display
}

// Frequently Bought Together associations
export interface ProductAssociation {
    productId: string;
    associatedProducts: { productId: string; confidence: number; label: string }[];
}

// WhatsApp Message Templates
export interface WhatsAppTemplate {
    id: string;
    name: string;
    trigger: 'manual' | 'days_inactive' | 'birthday' | 'post_purchase' | 'points_expiry' | 'low_points';
    triggerValue?: number; // e.g., days for inactive
    message: string;
    active: boolean;
}

export interface Product {
    id: string;
    description: string;
    price: number;
    stock: number;
    barcode?: string;
    image?: string;
    images?: string[]; // Array of up to 4 images
    attributes?: { [key: string]: string | number };
    categoryId?: string;
    department?: string;
    vatRate?: number;
    vatCode?: string;
    linkCode?: string;
    costPrice?: number;
    [key: string]: any; // Allow raw API fields for grid display
}

export interface CartItem {
    id: string; // Unique ID for the cart line
    productId: string | null; // Original product ID, null for manual entries
    description: string;
    quantity: number;
    price: number;
    discount: number;
    discountType: 'P' | 'V'; // 'P' for Percentage, 'V' for Value
    originalProduct?: Product;
    [key: string]: any; // Allow flattening product fields for grid display
}

export interface SaleState {
    type: 'sale' | 'return' | 'account' | 'account-return' | 'order' | 'quotation' | 'touch-sale' | 'touch-sale-classic';
    customer: Customer | null;
    headerDetails: {
        documentDate: string;
        deliveryDate: string;
        dueDate: string;
        referenceNo: string;
        warehouse: string;
        salesRep: string;
        mainSalesrep: string;
        vatIndicator: string;
        deliveryMethod: string;
        addressSelection: string;
        originalInvoiceNo?: string;
    };
    isUnallocated?: boolean;
    items: CartItem[];
    originalInvoiceItems?: any[];
}

export interface Payment {
    method: 'Cash' | 'Credit Card' | 'EFT' | 'RCS' | 'Account' | 'Cheque';
    amount: number;
}
