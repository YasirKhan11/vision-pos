import React, { useState } from 'react';
import './App.css';

// Types
import { Customer, SaleState } from './types/domain.types';

// Data
import { USE_MOCK_DATA } from './data/mockData';

// API
import { api } from './api';

// Utils
import {
    createInitialSale,
    createTouchSale,
    createAccountSale,
    createCashReturn,
    createAccountReturn,
    createDashboardSale
} from './utils/saleFactory';

// Pages
import { LoginPage } from './pages/LoginPage';
import { MainMenuPage } from './pages/MainMenuPage';
import { SaleHeaderPage } from './pages/SaleHeaderPage';
import { SaleItemsPage } from './pages/SaleItemsPage';
import { TouchSaleClassicPage } from './pages/TouchSaleClassicPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryIntelligenceDashboard } from './pages/InventoryIntelligenceDashboard';
import { SalesStatsDashboard } from './pages/SalesStatsDashboard';

const App = () => {
    const [page, setPage] = useState<string>(() => {
        return api.auth.isLoggedIn() ? 'menu' : 'login';
    });
    const [user, setUser] = useState<string | null>(() => {
        const currentUser = api.auth.getCurrentUser();
        return currentUser ? currentUser.username : null;
    });
    const [currentSale, setCurrentSale] = useState<SaleState | null>(null);
    const [dashboardType, setDashboardType] = useState<'order' | 'quotation' | null>(null);
    const [dashboardCustomer, setDashboardCustomer] = useState<Customer | null>(null);
    const [defaultWarehouse, setDefaultWarehouse] = useState<string>('01-ShopFloor');
    const [userSettings, setUserSettings] = useState<any>(() => api.auth.getCurrentUserSettings());
    const [tillNo, setTillNo] = useState<string>('199');

    // Load user settings and defaults on login or app start
    React.useEffect(() => {
        const loadSettings = async () => {
            if (!user || USE_MOCK_DATA) return;

            try {
                // Get settings from storage or fetch if missing
                let settings = api.auth.getCurrentUserSettings();
                if (!settings) {
                    settings = await api.auth.fetchUserSettings(user);
                }

                if (settings) {
                    setUserSettings(settings);
                    if (settings.deftillno) setTillNo(settings.deftillno);

                    // Try to load warehouse description if we have a default branch
                    const warehouses = await api.warehouses.getAll();
                    const wh = warehouses.find(w => w.WHCODE === settings.defbranch || w.WHCODE === settings.defco);
                    if (wh) {
                        setDefaultWarehouse(`${wh.WHCODE} - ${wh.WHDESC}`);
                    }
                }
            } catch (error) {
                console.error('Failed to load user settings:', error);
            }
        };
        loadSettings();
    }, [user]);

    const handleLogin = async (userCode: string) => {
        setUser(userCode);
        // User settings will be fetched by the useEffect
        setPage('menu');
    };

    const handleLogout = () => {
        // Clear API session
        if (!USE_MOCK_DATA) {
            api.auth.logout();
        }
        setUser(null);
        setUserSettings(null);
        setPage('login');
        setCurrentSale(null);
    };

    const handleStartNewSale = () => {
        setCurrentSale(createInitialSale(defaultWarehouse));
        setPage('saleHeader');
    };

    const handleStartTouchSale2 = () => {
        setCurrentSale(createTouchSale(defaultWarehouse));
        setPage('touchSaleClassic');
    };

    const handleStartSmartRetail = () => {
        setPage('inventoryIntelligence');
    };

    const handleStartSalesStats = () => {
        setPage('salesStats');
    };

    const handleStartAccountSale = () => {
        setCurrentSale(createAccountSale());
        setPage('saleHeader');
    };

    const handleStartCashReturn = () => {
        setCurrentSale(createCashReturn());
        setPage('saleHeader');
    };

    const handleStartAccountReturn = () => {
        setCurrentSale(createAccountReturn());
        setPage('saleHeader');
    };

    const handleStartSalesOrders = () => {
        setDashboardType('order');
        setDashboardCustomer(null);
        setPage('dashboard');
    };

    const handleStartQuotations = () => {
        setDashboardType('quotation');
        setDashboardCustomer(null);
        setPage('dashboard');
    };

    const handleCustomerSelectedForDashboard = (customer: Customer) => {
        setDashboardCustomer(customer);
        setPage('dashboard');
    };

    const handleCreateNewFromDashboard = () => {
        if (!dashboardCustomer || !dashboardType) return;
        setCurrentSale(createDashboardSale(dashboardType, dashboardCustomer));
        setPage('saleHeader');
    };

    const resetToMenu = () => {
        setCurrentSale(null);
        setDashboardType(null);
        setDashboardCustomer(null);
        setPage('menu');
    };

    const renderPage = () => {
        switch (page) {
            case 'menu':
                return <MainMenuPage
                    onStartCashSale={handleStartNewSale}
                    onStartTouchSale2={handleStartTouchSale2}
                    onStartCashReturn={handleStartCashReturn}
                    onStartAccountSale={handleStartAccountSale}
                    onStartAccountReturn={handleStartAccountReturn}
                    onStartSalesOrders={handleStartSalesOrders}
                    onStartQuotations={handleStartQuotations}
                    onStartSmartRetail={handleStartSmartRetail}
                    onStartSalesStats={handleStartSalesStats}
                />;
            case 'inventoryIntelligence':
                return <InventoryIntelligenceDashboard onBack={resetToMenu} />;
            case 'salesStats':
                return <SalesStatsDashboard onBack={resetToMenu} />;
            case 'dashboard':
                return <DashboardPage
                    customer={dashboardCustomer}
                    type={dashboardType!}
                    onCreateNew={handleCreateNewFromDashboard}
                    onBack={resetToMenu}
                    onCustomerChange={setDashboardCustomer}
                />;
            case 'saleHeader':
                return <SaleHeaderPage
                    sale={currentSale!}
                    setSale={setCurrentSale}
                    onProceed={() => setPage('saleItems')}
                    onBack={() => {
                        // If coming from a dashboard flow, go back to the dashboard
                        if (dashboardType && dashboardCustomer) {
                            setPage('dashboard');
                            setCurrentSale(null); // Clear the in-progress sale
                        } else {
                            resetToMenu();
                        }
                    }}
                />;
            case 'saleItems':
                return <SaleItemsPage
                    sale={currentSale!}
                    setSale={setCurrentSale}
                    onBack={() => setPage('saleHeader')}
                    onComplete={resetToMenu}
                />;
            case 'touchSaleClassic':
                return <TouchSaleClassicPage
                    sale={currentSale!}
                    setSale={setCurrentSale}
                    onBack={resetToMenu}
                    onComplete={resetToMenu}
                    user={user}
                />
            case 'login':
            default:
                return <LoginPage onLogin={handleLogin} />;
        }
    };

    return (
        <div className="flex flex-col w-full h-screen overflow-hidden bg-white">
            <header className="flex items-center justify-between px-6 py-2 shrink-0 bg-primary text-white">
                {/* Header is intentionally slimmed down; title and user info moved to footer */}
            </header>
            <main className="relative flex flex-col flex-1 overflow-y-auto">
                {renderPage()}
            </main>
            <footer className="flex items-center justify-between px-6 py-1.5 text-xs text-gray-500 shrink-0 bg-secondary border-t border-border">
                <div className="flex items-center gap-2">
                    <span>Version: 18.0.3.0 | Vision Modern POS</span>
                    {user && (<span>| User: {user} | Till: {tillNo}</span>)}
                </div>
                <div className="flex items-center gap-4">
                    <span>{new Date().toLocaleString()}</span>
                    {user && (
                        <button
                            onClick={handleLogout}
                            className="ml-4 px-3 py-1.5 border border-gray-400 text-gray-600 rounded hover:bg-primary-dark hover:text-white hover:border-primary-dark transition-colors"
                        >
                            Log Out
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default App;