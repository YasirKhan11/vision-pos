# Vision POS - API Integration Guide

## Developer Documentation

This guide explains how the Vision POS React frontend integrates with your Vision ERP/POS Gateway API.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API URL

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://your-server:8080
```

### 3. Toggle Mock/API Mode

In `index.tsx`, line 11:
```typescript
const USE_MOCK_DATA = false; // Set to true for demo without backend
```

### 4. Run Development Server

```bash
npm run dev
```

---

## Integration Status

### ✅ Fully Integrated Components

| Component | API Endpoints Used |
|-----------|-------------------|
| **Login Page** | `POST /login`, `GET /` (health check) |
| **Product Search** | `GET /stkmaster` |
| **Customer Search** | `GET /debmaster` |
| **Sale Items Page** | Products from `/stkmaster` |
| **Touch Sale Classic** | Products + Customers |
| **Customer Selection** | `GET /debmaster` |
| **Sale Header** | Customers from `/debmaster`, `POST /debmaster` (create) |

### 🔄 Using Mock Data (for demo)

- Parts Finder (vehicle-specific parts)
- Frequently Bought Together suggestions
- WhatsApp templates
- Sales Orders/Quotations dashboard

---

## Authentication Flow

### Login Process

```typescript
// 1. User enters credentials
// 2. Frontend calls API
await api.auth.login({ username, password });

// 3. JWT token stored in localStorage
// 4. Token auto-injected in subsequent requests
// 5. Token auto-refreshed before expiry
```

### Token Management

- **Validity:** 3 hours
- **Auto-refresh:** 10 minutes before expiry
- **Storage:** `localStorage` with keys:
  - `vision_jwt_token`
  - `vision_token_expiry`

### Logout

```typescript
api.auth.logout(); // Clears all stored tokens
```

---

## Data Transformation

The frontend uses different field names than the API. Transformation functions convert between formats:

### Products (API → Frontend)

```typescript
// API Response (STKMASTER)
{
  STKCODE: 'ABC123',
  STKDESC: 'Product Name',
  STKPRICE1: 99.99,
  STKQTYONHAND: 50,
  STKBARCODE: '1234567890'
}

// Frontend Format
{
  id: 'ABC123',
  description: 'Product Name',
  price: 99.99,
  stock: 50,
  barcode: '1234567890'
}
```

### Customers (API → Frontend)

```typescript
// API Response (DEBMASTER)
{
  DEBCODE: 'CUST001',
  DEBNAME: 'John Smith',
  DEBCREDITLIMIT: 10000,
  DEBADDR1: '123 Main St',
  DEBEMAIL: 'john@example.com'
}

// Frontend Format
{
  id: 'CUST001',
  name: 'John Smith',
  creditLimit: 10000,
  address1: '123 Main St',
  email: 'john@example.com'
}
```

---

## Key Integration Points

### 1. Product Loading

Products are loaded when components mount:

```typescript
// In SaleItemsPage, TouchSaleClassicPage, ProductSearchModal
useEffect(() => {
  const loadProducts = async () => {
    if (USE_MOCK_DATA) return;
    
    const data = await api.products.getAll({ 
      STKACTIVE: 1,
      recordsperpage: 1000 
    });
    setProducts(data.map(transformApiProduct));
  };
  loadProducts();
}, []);
```

### 2. Customer Loading

```typescript
// In SaleHeaderPage, CustomerSelectionPage, TouchSaleClassicPage
useEffect(() => {
  const loadCustomers = async () => {
    if (USE_MOCK_DATA) return;
    
    const data = await api.customers.getAll({ 
      DEBACTIVE: 1,
      recordsperpage: 500 
    });
    setCustomers([CASH_CUSTOMER, ...data.map(transformApiCustomer)]);
  };
  loadCustomers();
}, []);
```

### 3. Barcode/Code Lookup

```typescript
// Search by code or barcode
const product = products.find(p => 
  p.id.toLowerCase() === code.toLowerCase()
);

// Or use API for barcode lookup
const item = await api.products.searchByBarcode(barcode);
```

### 4. Customer Creation

```typescript
const handleCreateCustomer = async (data) => {
  const apiCustomer = await api.customers.create({
    DEBCODE: `CUST${Date.now()}`,
    DEBNAME: data.name,
    DEBADDR1: data.address1,
    DEBEMAIL: data.email,
    // ...
  });
  const newCustomer = transformApiCustomer(apiCustomer);
};
```

---

## Error Handling

The frontend handles API errors gracefully:

```typescript
try {
  await api.auth.login({ username, password });
} catch (err) {
  if (err instanceof HttpError) {
    if (err.isUnauthorized()) {
      setError('Invalid username or password');
    } else if (err.isNetworkError()) {
      setError('Unable to connect to server');
    }
  }
}
```

---

## Loading States

All API-connected components show loading indicators:

- **Login:** "Signing in..." with spinner
- **Server Status:** Online/Offline indicator
- **Products:** "Loading products..." message
- **Customers:** "Loading customers..." message

---

## File Structure

```
/
├── index.tsx              # Main React app with API integration
├── index.css              # Styles
├── index.html             # Entry point
├── .env.example           # Environment config template
└── src/
    ├── api/
    │   ├── index.ts       # API exports
    │   ├── config.ts      # API configuration
    │   ├── httpClient.ts  # HTTP client with auth
    │   ├── authService.ts # Authentication
    │   ├── productService.ts  # Products
    │   ├── customerService.ts # Customers
    │   ├── salesService.ts    # Orders
    │   └── systemService.ts   # System data
    ├── types/
    │   └── api.types.ts   # TypeScript interfaces
    └── hooks/
        └── useApi.ts      # React hooks
```

---

## Testing Checklist

- [ ] Server health check works
- [ ] Login with valid credentials
- [ ] Login error with invalid credentials
- [ ] Products load in Sale Items page
- [ ] Products searchable by code
- [ ] Products searchable by description
- [ ] Barcode scanning finds products
- [ ] Customers load in search modal
- [ ] Customer lookup by code works
- [ ] New customer creation works
- [ ] Token refresh works (wait 2+ hours)
- [ ] Logout clears session

---

## Troubleshooting

### "Server Offline" on Login

1. Check API URL in `.env`
2. Verify server is running
3. Check CORS configuration on server

### Products/Customers Not Loading

1. Check browser console for errors
2. Verify JWT token is valid
3. Check network tab for failed requests

### "Session Expired" Errors

Token has expired. User needs to:
1. Login again
2. Or implement auto-redirect to login on 401

---

## API Endpoints Reference

| Feature | Endpoint | Method |
|---------|----------|--------|
| Login | `/login` | POST |
| Health Check | `/` | GET |
| Products | `/stkmaster` | GET |
| Product by Barcode | `/stkaltbarcodes` | GET |
| Customers | `/debmaster` | GET/POST/PUT |
| Orders | `/order` | POST |
| Tenders | `/systender` | GET |
| Branches | `/sysbranch` | GET |
| Warehouses | `/syswh` | GET |
