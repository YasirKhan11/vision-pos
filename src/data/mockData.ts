import { Customer, Product, ProductAssociation, WhatsAppTemplate } from '../types/domain.types';
import { toDateStringForMock } from '../utils/dates';

// --- CONFIG ---
export const USE_MOCK_DATA = false; // Using real API

// --- MOCK DATE HELPERS ---
const todayForMock = new Date();
const tomorrowForMock = new Date();
tomorrowForMock.setDate(todayForMock.getDate() + 1);
const yesterdayForMock = new Date();
yesterdayForMock.setDate(todayForMock.getDate() - 1);
const thirtyFiveDaysAgoForMock = new Date();
thirtyFiveDaysAgoForMock.setDate(todayForMock.getDate() - 35);

// --- MOCK DATA ---
export const CASH_CUSTOMER: Customer = {
    id: 'CASH',
    name: 'CASH SALE',
    creditLimit: 0,
    address: '',
    email: '',
    phone: '',
    priceLevel: 1
};

export const MOCK_SALES_ORDERS = [
    { id: 'SO-001', date: toDateStringForMock(thirtyFiveDaysAgoForMock), deliveryDate: toDateStringForMock(yesterdayForMock), total: 5600.50, status: 'Open' }, // Older than 30 days
    { id: 'SO-002', date: '2024-06-22', deliveryDate: '2024-07-29', total: 1250.00, status: 'Invoiced' },
    { id: 'SO-003', date: toDateStringForMock(yesterdayForMock), deliveryDate: toDateStringForMock(todayForMock), total: 899.99, status: 'Open' }, // Due today
    { id: 'SO-004', date: toDateStringForMock(todayForMock), deliveryDate: toDateStringForMock(tomorrowForMock), total: 150.00, status: 'Open' }, // Due tomorrow
    { id: 'SO-005', date: '2024-07-10', deliveryDate: '2024-08-15', total: 3200.00, status: 'Back Order' },
    { id: 'SO-006', date: toDateStringForMock(todayForMock), deliveryDate: toDateStringForMock(tomorrowForMock), total: 750.00, status: 'Back Order' }, // Back order, also due tomorrow
];

export const MOCK_QUOTATIONS = [
    { id: 'QT-001', date: '2024-07-15', total: 3500.00, status: 'Accepted' },
    { id: 'QT-002', date: '2024-07-18', total: 450.00, status: 'Expired' },
];

export const VAT_RATE = 0.15; // 15%

// --- MOCK CUSTOMERS REMOVED ---
// All debtors now loaded via API

export const PRODUCT_ASSOCIATIONS: ProductAssociation[] = [
    {
        productId: 'A11159A',
        associatedProducts: [
            { productId: 'A11906', confidence: 0.85, label: 'Brake Disc Rear' },
            { productId: 'A12355', confidence: 0.72, label: 'Brake Pads' },
        ]
    },
    {
        productId: 'A11906',
        associatedProducts: [
            { productId: 'A11159A', confidence: 0.85, label: 'Brake Disc Front' },
            { productId: 'A12355', confidence: 0.68, label: 'Brake Pads' },
        ]
    },
    {
        productId: 'MSC003',
        associatedProducts: [
            { productId: 'KBD004', confidence: 0.78, label: 'Mechanical Keyboard' },
            { productId: 'USB006', confidence: 0.45, label: 'USB-C Hub' },
        ]
    },
    {
        productId: 'KBD004',
        associatedProducts: [
            { productId: 'MSC003', confidence: 0.78, label: 'Wireless Mouse' },
            { productId: 'MON005', confidence: 0.52, label: '27-inch Monitor' },
        ]
    },
    {
        productId: 'MON005',
        associatedProducts: [
            { productId: 'KBD004', confidence: 0.52, label: 'Mechanical Keyboard' },
            { productId: 'USB006', confidence: 0.61, label: 'USB-C Hub' },
            { productId: 'HDP007', confidence: 0.38, label: 'Headphones' },
        ]
    },
    {
        productId: 'PEN001',
        associatedProducts: [
            { productId: 'PAP002', confidence: 0.82, label: 'A4 Paper' },
            { productId: 'BRD718', confidence: 0.45, label: 'A3 Pads' },
        ]
    },
    {
        productId: 'PAP002',
        associatedProducts: [
            { productId: 'PEN001', confidence: 0.82, label: 'Ballpoint Pens' },
            { productId: '6308', confidence: 0.55, label: 'Staples Refill' },
        ]
    },
    {
        productId: 'COKE300',
        associatedProducts: [
            { productId: 'FANTAO', confidence: 0.65, label: 'Fanta Orange' },
            { productId: 'GAUVAJ', confidence: 0.42, label: 'Guava Juice' },
        ]
    },
    {
        productId: 'OA020',
        associatedProducts: [
            { productId: 'COKE300', confidence: 0.55, label: 'Coke 300ml' },
            { productId: 'FANTAO', confidence: 0.48, label: 'Fanta Orange' },
        ]
    },
];

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
    {
        id: 'welcome',
        name: 'Welcome Message',
        trigger: 'manual',
        message: 'Welcome to Vision POS! 🎉 Thank you for your purchase today. Your loyalty points have been credited to your account.',
        active: true
    },
    {
        id: 'miss_you',
        name: 'We Miss You',
        trigger: 'days_inactive',
        triggerValue: 30,
        message: 'Hi {customer_name}! 👋 We noticed you haven\'t visited us in a while. We miss you! Enjoy 10% off your next purchase. Use code: COMEBACK10',
        active: true
    },
    {
        id: 'birthday',
        name: 'Birthday Wishes',
        trigger: 'birthday',
        message: 'Happy Birthday {customer_name}! 🎂🎉 As our valued customer, enjoy a special birthday gift - 15% off your next purchase! Valid this month.',
        active: true
    },
    {
        id: 'thank_you',
        name: 'Post Purchase Thank You',
        trigger: 'post_purchase',
        message: 'Thank you for shopping with us today, {customer_name}! 🛒\n\nYou earned {points_earned} loyalty points.\nTotal Points: {points_balance}\n\nSee you again soon!',
        active: true
    },
    {
        id: 'points_expiry',
        name: 'Points Expiring Soon',
        trigger: 'points_expiry',
        triggerValue: 7,
        message: 'Hi {customer_name}! ⚠️ You have {expiring_points} loyalty points expiring in {days} days. Visit us soon to redeem your rewards worth R{reward_value}!',
        active: true
    },
    {
        id: 'tier_upgrade',
        name: 'Tier Upgrade Notification',
        trigger: 'manual',
        message: 'Congratulations {customer_name}! 🏆 You\'ve been upgraded to {new_tier} status! Enjoy enhanced benefits and earn points faster.',
        active: true
    },
];

export const MOCK_CATEGORIES = [
    { id: 'stationery', name: 'Stationery', icon: '📝' },
    { id: 'electronics', name: 'Electronics', icon: '💻' },
    { id: 'furniture', name: 'Furniture', icon: '🛋️' },
    { id: 'consumables', name: 'Consumables', icon: '🥤' },
    { id: 'cleaning', name: 'Cleaning', icon: '🧼' },
];

export const MOCK_PRODUCTS: Product[] = [
    { id: '1001', description: 'Numeric Product 1', price: 10.00, stock: 100, categoryId: 'consumables', image: 'https://via.placeholder.com/300x300.png?text=1001', images: ['https://via.placeholder.com/300x300.png?text=1001-1', 'https://via.placeholder.com/300x300.png?text=1001-2', 'https://via.placeholder.com/300x300.png?text=1001-3', 'https://via.placeholder.com/300x300.png?text=1001-4'] },
    { id: '1002', description: 'Numeric Product 2', price: 25.50, stock: 50, categoryId: 'electronics', image: 'https://via.placeholder.com/300x300.png?text=1002', images: ['https://via.placeholder.com/300x300.png?text=1002-1', 'https://via.placeholder.com/300x300.png?text=1002-2', 'https://via.placeholder.com/300x300.png?text=1002-3', 'https://via.placeholder.com/300x300.png?text=1002-4'] },
    { id: '1003', description: 'Numeric Product 3', price: 5.75, stock: 200, categoryId: 'stationery', image: 'https://via.placeholder.com/300x300.png?text=1003', images: ['https://via.placeholder.com/300x300.png?text=1003-1', 'https://via.placeholder.com/300x300.png?text=1003-2', 'https://via.placeholder.com/300x300.png?text=1003-3', 'https://via.placeholder.com/300x300.png?text=1003-4'] },
    { id: 'COKE300', description: 'Coke 300ml', price: 18.00, stock: 999, categoryId: 'consumables', image: 'https://via.placeholder.com/300x300.png?text=COKE', images: ['https://via.placeholder.com/300x300.png?text=COKE-1', 'https://via.placeholder.com/300x300.png?text=COKE-2', 'https://via.placeholder.com/300x300.png?text=COKE-3', 'https://via.placeholder.com/300x300.png?text=COKE-4'] },
    { id: 'FANTAO', description: 'Fanta Orange', price: 18.00, stock: 999, categoryId: 'consumables', image: 'https://via.placeholder.com/300x300.png?text=FANTA', images: ['https://via.placeholder.com/300x300.png?text=FANTA-1', 'https://via.placeholder.com/300x300.png?text=FANTA-2', 'https://via.placeholder.com/300x300.png?text=FANTA-3', 'https://via.placeholder.com/300x300.png?text=FANTA-4'] },
    { id: 'GAUVAJ', description: 'Gauva Juice', price: 25.00, stock: 999, categoryId: 'consumables', image: 'https://via.placeholder.com/300x300.png?text=GUAVA', images: ['https://via.placeholder.com/300x300.png?text=GUAVA-1', 'https://via.placeholder.com/300x300.png?text=GUAVA-2', 'https://via.placeholder.com/300x300.png?text=GUAVA-3', 'https://via.placeholder.com/300x300.png?text=GUAVA-4'] },
    { id: 'IMP035', description: 'PED1200X600BLKRDR2DRW1DFNLOCKSHELF', price: 3165.80, stock: 990, image: 'https://via.placeholder.com/300x300.png?text=IMP035', images: ['https://via.placeholder.com/300x300.png?text=IMP035-1', 'https://via.placeholder.com/300x300.png?text=IMP035-2', 'https://via.placeholder.com/300x300.png?text=IMP035-3', 'https://via.placeholder.com/300x300.png?text=IMP035-4'], categoryId: 'furniture' },
    { id: 'BRD718', description: 'A3 PADS BUTTERFLY BRIGHT ASST 50PG', price: 55.94, stock: 500, image: 'https://via.placeholder.com/300x300.png?text=BRD718', images: ['https://via.placeholder.com/300x300.png?text=BRD718-1', 'https://via.placeholder.com/300x300.png?text=BRD718-2', 'https://via.placeholder.com/300x300.png?text=BRD718-3', 'https://via.placeholder.com/300x300.png?text=BRD718-4'], categoryId: 'stationery' },
    { id: 'OA020', description: 'COCA-COLA COLDRINK 330ML CASE 24', price: 285.94, stock: 120, image: 'https://via.placeholder.com/300x300.png?text=OA020', images: ['https://via.placeholder.com/300x300.png?text=OA020-1', 'https://via.placeholder.com/300x300.png?text=OA020-2', 'https://via.placeholder.com/300x300.png?text=OA020-3', 'https://via.placeholder.com/300x300.png?text=OA020-4'], categoryId: 'consumables' },
    { id: 'ALI001', description: 'DESK 2000X900 BOWED FRONT 32MM', price: 2652.10, stock: 30, categoryId: 'furniture', image: 'https://via.placeholder.com/300x300.png?text=ALI001', images: ['https://via.placeholder.com/300x300.png?text=ALI001-1', 'https://via.placeholder.com/300x300.png?text=ALI001-2', 'https://via.placeholder.com/300x300.png?text=ALI001-3', 'https://via.placeholder.com/300x300.png?text=ALI001-4'] },
    { id: 'DASUN7195ECO', description: 'YELLOW DUSTER ECONO', price: 2.73, stock: 1000, categoryId: 'cleaning', image: 'https://via.placeholder.com/300x300.png?text=DUSTER', images: ['https://via.placeholder.com/300x300.png?text=DUSTER-1', 'https://via.placeholder.com/300x300.png?text=DUSTER-2', 'https://via.placeholder.com/300x300.png?text=DUSTER-3', 'https://via.placeholder.com/300x300.png?text=DUSTER-4'] },
    { id: '6308', description: 'CARTRIDGE 06308 30 REFILL STAPLES 5000', price: 346.23, stock: 250, categoryId: 'stationery', image: 'https://via.placeholder.com/300x300.png?text=6308', images: ['https://via.placeholder.com/300x300.png?text=6308-1', 'https://via.placeholder.com/300x300.png?text=6308-2', 'https://via.placeholder.com/300x300.png?text=6308-3', 'https://via.placeholder.com/300x300.png?text=6308-4'] },
    { id: 'PEN001', description: 'BIC Ballpoint Pen Black (Box of 50)', price: 150.00, stock: 800, image: 'https://via.placeholder.com/300x300.png?text=PEN001', images: ['https://via.placeholder.com/300x300.png?text=PEN001-1', 'https://via.placeholder.com/300x300.png?text=PEN001-2', 'https://via.placeholder.com/300x300.png?text=PEN001-3', 'https://via.placeholder.com/300x300.png?text=PEN001-4'], categoryId: 'stationery' },
    { id: 'PAP002', description: 'A4 Printing Paper 80gsm (Ream)', price: 85.50, stock: 2000, categoryId: 'stationery', image: 'https://via.placeholder.com/300x300.png?text=PAP002', images: ['https://via.placeholder.com/300x300.png?text=PAP002-1', 'https://via.placeholder.com/300x300.png?text=PAP002-2', 'https://via.placeholder.com/300x300.png?text=PAP002-3', 'https://via.placeholder.com/300x300.png?text=PAP002-4'] },
    { id: 'MSC003', description: 'Wireless Mouse Ergonomic', price: 250.00, stock: 150, image: 'https://via.placeholder.com/300x300.png?text=MSC003', images: ['https://via.placeholder.com/300x300.png?text=MSC003-1', 'https://via.placeholder.com/300x300.png?text=MSC003-2', 'https://via.placeholder.com/300x300.png?text=MSC003-3', 'https://via.placeholder.com/300x300.png?text=MSC003-4'], categoryId: 'electronics' },
    { id: 'KBD004', description: 'Mechanical Keyboard RGB', price: 899.99, stock: 75, image: 'https://via.placeholder.com/300x300.png?text=KBD004', images: ['https://via.placeholder.com/300x300.png?text=KBD004-1', 'https://via.placeholder.com/300x300.png?text=KBD004-2', 'https://via.placeholder.com/300x300.png?text=KBD004-3', 'https://via.placeholder.com/300x300.png?text=KBD004-4'], categoryId: 'electronics' },
    { id: 'MON005', description: '27-inch 4K Monitor', price: 4500.00, stock: 50, image: 'https://via.placeholder.com/300x300.png?text=MON005', images: ['https://via.placeholder.com/300x300.png?text=MON005-1', 'https://via.placeholder.com/300x300.png?text=MON005-2', 'https://via.placeholder.com/300x300.png?text=MON005-3', 'https://via.placeholder.com/300x300.png?text=MON005-4'], categoryId: 'electronics' },
    { id: 'USB006', description: 'USB-C Hub 7-in-1', price: 450.00, stock: 300, image: 'https://via.placeholder.com/300x300.png?text=USB006', images: ['https://via.placeholder.com/300x300.png?text=USB006-1', 'https://via.placeholder.com/300x300.png?text=USB006-2', 'https://via.placeholder.com/300x300.png?text=USB006-3', 'https://via.placeholder.com/300x300.png?text=USB006-4'], categoryId: 'electronics' },
    { id: 'HDP007', description: 'Noise Cancelling Headphones', price: 1250.00, stock: 90, image: 'https://via.placeholder.com/300x300.png?text=HDP007', images: ['https://via.placeholder.com/300x300.png?text=HDP007-1', 'https://via.placeholder.com/300x300.png?text=HDP007-2', 'https://via.placeholder.com/300x300.png?text=HDP007-3', 'https://via.placeholder.com/300x300.png?text=HDP007-4'], categoryId: 'electronics' },
];

export const MOCK_MANUFACTURERS = [
    { id: 'volkswagen', name: 'VOLKSWAGEN' }, { id: 'audi', name: 'AUDI' }, { id: 'bmw', name: 'BMW' }, { id: 'mercedes', name: 'MERCEDES-BENZ' }, { id: 'toyota', name: 'TOYOTA' }, { id: 'ford', name: 'FORD' }
];
export const MOCK_MODELS = [
    { id: 'golf-vii', name: 'GOLF VII (5G1, BQ1, BE1, BE2) 2012 - 2025', manufacturerId: 'volkswagen' },
    { id: 'polo-v', name: 'POLO V (6R, 6C) 2009 - 2017', manufacturerId: 'volkswagen' },
];
export const MOCK_VARIANTS = [
    { id: 'gti-220', name: '2.0 GTI (CHHB) - 162 kW / 220 HP', modelId: 'golf-vii' },
    { id: 'gti-210', name: '2.0 GTI (CNTA|CXCA) - 155 kW / 210 HP', modelId: 'golf-vii' },
    { id: 'tdi-150', name: '2.0 TDI (CRBC) - 110 kW / 150 HP', modelId: 'golf-vii' },
];
export const MOCK_DEPARTMENTS = [{ id: 'brakes', name: 'Brakes' }, { id: 'engine', name: 'Engine' }, { id: 'suspension', name: 'Suspension' }];
export const MOCK_SUB_DEPARTMENTS = [
    { id: 'brake-discs', name: 'Brake Discs', departmentId: 'brakes' },
    { id: 'brake-pads', name: 'Brake Pads', departmentId: 'brakes' },
];
export const MOCK_PARTS: (Product & { variantIds: string[], subDepartmentId: string })[] = [
    {
        id: 'A11159A', description: 'BRAKE DISC FRONT', price: 1250.50, stock: 10,
        image: 'https://i.imgur.com/gT32JAb.png',
        attributes: { 'Bolt Hole Circle Ø': 112, 'Brake Disc Thickness': 30, 'Brake Disc Type': 'internally vented', 'Centering Diameter': 65, Height: 49.6, 'Hole Arrangement/Number': '05/10', Machining: 'High-carbon', 'Minimum thickness': 27 },
        variantIds: ['gti-220', 'gti-210'], subDepartmentId: 'brake-discs'
    },
    {
        id: 'A11906', description: 'BRAKE DISC REAR', price: 975.00, stock: 8,
        image: 'https://i.imgur.com/4zL49V4.png',
        attributes: { 'Bolt Hole Circle Ø': 112, 'Brake Disc Thickness': 22, 'Brake Disc Type': 'vented', 'Centering Diameter': 65, Height: 48.2, 'Hole Arrangement/Number': '05/10', Machining: 'High-carbon', 'Minimum thickness': 20 },
        variantIds: ['gti-220', 'gti-210'], subDepartmentId: 'brake-discs'
    },
    {
        id: 'A12355', description: 'BRAKE DISC REAR (SOLID)', price: 650.00, stock: 25,
        image: 'https://i.imgur.com/t8i5C9f.png',
        attributes: { 'Bolt Hole Circle Ø': 100, 'Brake Disc Thickness': 10, 'Brake Disc Type': 'solid', 'Centering Diameter': 65, Height: 39.4, 'Hole Arrangement/Number': '05/10', Machining: 'Standard', 'Minimum thickness': 8 },
        variantIds: ['tdi-150'], subDepartmentId: 'brake-discs'
    }
];

export const VAT_INDICATOR_OPTIONS = {
    'I': 'Inclusive',
    'E': 'Exclusive',
    'N': 'Zero Rated',
    'X': 'Exempted'
};

export const SALESREP_OPTIONS = [
    '101-MZ', '102-JD', '103-SP'
];

export const WAREHOUSE_OPTIONS = [
    '01-ShopFloor', '02-BulkStore', '03-Returns'
];


export const MOCK_SALES_TODAY = [
    { id: '1', invoiceNo: 'INV-001', customerName: 'John Doe', customerId: 'C001', salesPerson: 'Jane', picker: 'Bob', total: 1200, itemCount: 5, timestamp: '08:15' },
    { id: '2', invoiceNo: 'INV-002', customerName: 'Alice Smith', customerId: 'C002', salesPerson: 'Mike', picker: 'Bob', total: 450, itemCount: 2, timestamp: '09:30' },
    { id: '3', invoiceNo: 'INV-003', customerName: 'Cash Scale', customerId: 'CASH', salesPerson: 'Jane', picker: 'Tom', total: 890, itemCount: 3, timestamp: '10:45' },
    { id: '4', invoiceNo: 'INV-004', customerName: 'Bob Brown', customerId: 'C003', salesPerson: 'Mike', picker: 'Tom', total: 2100, itemCount: 10, timestamp: '11:20' },
    { id: '5', invoiceNo: 'INV-005', customerName: 'Eve White', customerId: 'C004', salesPerson: 'Jane', picker: 'Bob', total: 1560, itemCount: 6, timestamp: '12:10' },
    { id: '6', invoiceNo: 'INV-006', customerName: 'Cash Sale', customerId: 'CASH', salesPerson: 'Mike', picker: 'Tom', total: 320, itemCount: 1, timestamp: '13:05' },
    { id: '7', invoiceNo: 'INV-007', customerName: 'Frank Green', customerId: 'C005', salesPerson: 'Jane', picker: 'Bob', total: 1800, itemCount: 8, timestamp: '14:40' },
    { id: '8', invoiceNo: 'INV-008', customerName: 'Grace Hall', customerId: 'C006', salesPerson: 'Mike', picker: 'Tom', total: 950, itemCount: 4, timestamp: '15:25' },
    { id: '9', invoiceNo: 'INV-009', customerName: 'Cash Sale', customerId: 'CASH', salesPerson: 'Jane', picker: 'Bob', total: 4200, itemCount: 15, timestamp: '16:15' },
    { id: '10', invoiceNo: 'INV-010', customerName: 'Henry Ford', customerId: 'C007', salesPerson: 'Mike', picker: 'Tom', total: 2750, itemCount: 9, timestamp: '17:00' }
];

export const MOCK_TOP_ITEMS = [
    { id: '1', itemCode: '1', description: 'Coke 300ml', quantitySold: 150, totalValue: 2700 },
    { id: '2', itemCode: '2', description: 'Fanta Orange', quantitySold: 120, totalValue: 2160 },
    { id: '3', itemCode: '3', description: 'A4 Paper Ream', quantitySold: 85, totalValue: 7267.50 },
    { id: '4', itemCode: '4', description: 'Bic Pen Black', quantitySold: 200, totalValue: 3000 },
    { id: '5', itemCode: '5', description: 'USB-C Cable', quantitySold: 45, totalValue: 6750 }
];

export const MOCK_TILL_STATS = [
    { id: 'TS01', tillNo: 'T01', tillName: 'Main Till', openedAt: '08:00', closedAt: null, cashier: 'John D', openingFloat: 1000, cashSales: 5000, cardSales: 10400, accountSales: 0, totalSales: 15400, cashInDrawer: 6000, variance: 0, transactionCount: 45, voidCount: 2, refundCount: 1 },
    { id: 'TS02', tillNo: 'T02', tillName: 'Express Till', openedAt: '08:30', closedAt: null, cashier: 'Sarah M', openingFloat: 1000, cashSales: 3000, cardSales: 9850.50, accountSales: 0, totalSales: 12850.50, cashInDrawer: 4000, variance: 0, transactionCount: 38, voidCount: 0, refundCount: 0 },
    { id: 'TS03', tillNo: 'T03', tillName: 'Back Office', openedAt: '09:00', closedAt: null, cashier: 'Mike R', openingFloat: 500, cashSales: 6500, cardSales: 12400, accountSales: 5000, totalSales: 23900, cashInDrawer: 7000, variance: -50, transactionCount: 52, voidCount: 1, refundCount: 2 }
];

export const MOCK_CASHIER_STATS = [
    { id: 'C01', name: 'John Doe', tillNo: 'T01', customerCount: 45, itemCount: 180, saleValue: 15400.00, avgItemsPerSale: 4, avgSaleValue: 342.22, startTime: '08:00', endTime: null },
    { id: 'C02', name: 'Sarah Mike', tillNo: 'T02', customerCount: 38, itemCount: 114, saleValue: 12850.50, avgItemsPerSale: 3, avgSaleValue: 338.17, startTime: '08:30', endTime: null },
    { id: 'C03', name: 'Mike Ross', tillNo: 'T03', customerCount: 52, itemCount: 260, saleValue: 18900.00, avgItemsPerSale: 5, avgSaleValue: 363.46, startTime: '09:00', endTime: null }
];

export const MOCK_VOID_SALES = [
    { id: 'V001', invoiceNo: 'INV-00X', originalTotal: 150.00, voidedAt: '10:15', voidedBy: 'Manager', reason: 'Mistake', approvedBy: 'Manager', customerName: 'John Doe', itemCount: 2 },
    { id: 'V002', invoiceNo: 'INV-00Y', originalTotal: 450.00, voidedAt: '14:30', voidedBy: 'Manager', reason: 'Customer Changed Mind', approvedBy: 'Manager', customerName: 'Jane Doe', itemCount: 5 }
];

export const MOCK_ITEMS_BELOW_COST = [
    { id: 'IBC001', invoiceNo: 'INV-100', itemCode: 'PROD_001', description: 'Loss Leader Item A', costPrice: 100, soldPrice: 95, quantity: 10, lossAmount: 50, soldBy: 'John D', soldAt: '09:00', approvedBy: 'Manager' },
    { id: 'IBC002', invoiceNo: 'INV-101', itemCode: 'PROD_002', description: 'Clearance Item B', costPrice: 50, soldPrice: 40, quantity: 20, lossAmount: 200, soldBy: 'Sarah M', soldAt: '11:00', approvedBy: 'Supervisor' }
];

export const MOCK_PROMOTION_SALES = [
    { id: 'P001', promotionName: 'Summer Sale', itemCode: 'SUM01', description: 'Beach Towel', normalPrice: 200, promoPrice: 150, discount: 50, quantitySold: 120, totalSavings: 6000, validFrom: '2025-01-01', validTo: '2025-01-31' },
    { id: 'P002', promotionName: 'Back to School', itemCode: 'SCH02', description: 'Backpack', normalPrice: 450, promoPrice: 350, discount: 100, quantitySold: 350, totalSavings: 35000, validFrom: '2025-01-05', validTo: '2025-01-20' },
    { id: 'P003', promotionName: 'Bulk Buy Discount', itemCode: 'BLK03', description: 'Water Case x24', normalPrice: 180, promoPrice: 150, discount: 30, quantitySold: 80, totalSavings: 2400, validFrom: '2025-01-10', validTo: '2025-01-15' }
];

