# Vision POS - React Frontend

A modern Point of Sale system built with React, TypeScript, and Vite.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API URL (optional)
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL=http://your-server:8080

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

## Build for Production

```bash
# Build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
visionpos/
├── index.html              # Entry HTML
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
├── .env.example            # Environment template
│
└── src/
    ├── main.tsx            # App entry point
    ├── App.tsx             # Main application (all components)
    ├── App.css             # All styles
    │
    ├── api/                # API service layer
    │   ├── index.ts
    │   ├── config.ts
    │   ├── httpClient.ts
    │   ├── authService.ts
    │   ├── productService.ts
    │   ├── customerService.ts
    │   ├── salesService.ts
    │   └── systemService.ts
    │
    ├── types/              # TypeScript interfaces
    │   ├── index.ts
    │   └── api.types.ts
    │
    ├── hooks/              # React hooks
    │   └── useApi.ts
    │
    └── context/            # React context
        └── ApiContext.tsx
```

## Configuration

### API URL

Set the API base URL in `.env`:

```env
VITE_API_BASE_URL=http://your-vision-api-server:8080
```

### Mock Mode

To run without a backend (demo mode), edit `src/App.tsx` line 11:

```typescript
const USE_MOCK_DATA = true; // Set to true for demo mode
```

## Features

- **Transaction Types**: Cash Sales, Cash Returns, Account Sales, Account Returns, Sales Orders, Quotations
- **Touch Sale Classic**: Fast POS interface
- **Product Search**: By code, barcode, or description
- **Customer Management**: Search, create, credit check
- **Real-time API Integration**: JWT authentication, auto token refresh
- **Retail Intelligence**: Customer insights, loyalty points
- **Responsive Design**: Desktop and tablet support

## API Integration

The app uses these TXTP codes:

| Transaction | TXTP Code |
|------------|-----------|
| Cash Sales | POSCSH |
| Cash Returns | POSCSR |
| Account Sales | POSASL |
| Account Returns | POSART |
| Sales Orders | DEBSOR |
| Quotations | DEBQOT |

## Tech Stack

- React 18
- TypeScript 5
- Vite 5
- CSS (no framework)

## Development

```bash
# Run dev server with hot reload
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build
```

## License

Proprietary - Vision Software
