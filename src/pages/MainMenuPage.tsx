import React, { useState } from 'react';
import { useHotkeys } from '../hooks/useHotkeys';
import { TillAdminMenu } from '../components/common/TillAdminMenu';

interface MainMenuPageProps {
    onStartCashSale: () => void;
    onStartCashReturn: () => void;
    onStartAccountSale: () => void;
    onStartAccountReturn: () => void;
    onStartSalesOrders: () => void;
    onStartQuotations: () => void;
    onStartTouchSale2: () => void;
    onStartSmartRetail: () => void;
    onStartSalesStats: () => void;
}

export const MainMenuPage = ({
    onStartCashSale,
    onStartCashReturn,
    onStartAccountSale,
    onStartAccountReturn,
    onStartSalesOrders,
    onStartQuotations,
    onStartTouchSale2,
    onStartSmartRetail,
    onStartSalesStats
}: MainMenuPageProps) => {
    const [showTillAdmin, setShowTillAdmin] = useState(false);

    const menuGroups = [
        {
            title: 'SALES',
            items: [
                { title: 'Cash Sales', key: 'F2', action: onStartCashSale, emoji: '🛒' },
                { title: 'Account Sales', key: 'F3', action: onStartAccountSale, emoji: '💼' },
            ]
        },
        {
            title: 'RETURNS',
            items: [
                { title: 'Cash Returns', key: 'F4', action: onStartCashReturn, emoji: '↩️' },
                { title: 'Account Returns', key: 'F5', action: onStartAccountReturn, emoji: '↪️' },
            ]
        },
        {
            title: 'PAYMENTS',
            items: [
                { title: 'Payments', key: 'F6', disabled: true, emoji: '💳' },
                { title: 'Vouchers', key: '', disabled: true, emoji: '🎫' },
            ]
        },
        {
            title: 'LAYBYE',
            items: [
                { title: 'Laybyes', key: '', disabled: true, emoji: '📑' },
            ]
        },
        {
            title: 'ORDERS',
            items: [
                { title: 'Sales Orders', key: 'F9', action: onStartSalesOrders, emoji: '📦' },
                { title: 'Quotations', key: 'F10', action: onStartQuotations, emoji: '📋' },
            ]
        },
        {
            title: 'SMART RETAIL',
            items: [
                { title: 'Inventory Intelligence', key: 'F8', action: onStartSmartRetail, emoji: '🧠' },
                { title: 'Sales Stats', key: 'F7', action: onStartSalesStats, emoji: '📈' },
            ]
        },
        {
            title: 'ADMINISTRATOR',
            items: [
                { title: 'Till Admin', key: 'F12', action: () => setShowTillAdmin(true), emoji: '🔧' },
                { title: 'Touch Screen Classic', key: 'F11', action: onStartTouchSale2, emoji: '⌨️' },
            ]
        },
    ];

    useHotkeys({
        'F2': onStartCashSale,
        'F3': onStartAccountSale,
        'F4': onStartCashReturn,
        'F5': onStartAccountReturn,
        'F7': onStartSalesStats,
        'F8': onStartSmartRetail,
        'F9': onStartSalesOrders,
        'F10': onStartQuotations,
        'F11': onStartTouchSale2,
        'F12': () => setShowTillAdmin(true),
        'Escape': () => setShowTillAdmin(false),
    }, [onStartCashSale, onStartCashReturn, onStartAccountSale, onStartAccountReturn, onStartSalesOrders, onStartQuotations, onStartTouchSale2, onStartSmartRetail, onStartSalesStats, showTillAdmin]);

    // Organizing groups by column - 4 columns now
    const column1 = menuGroups.filter(g => ['SALES', 'ORDERS'].includes(g.title));
    const column2 = menuGroups.filter(g => ['RETURNS', 'SMART RETAIL'].includes(g.title));
    const column3 = menuGroups.filter(g => ['PAYMENTS', 'ADMINISTRATOR'].includes(g.title));
    const column4 = menuGroups.filter(g => ['LAYBYE'].includes(g.title));

    const renderGroup = (group: any) => (
        <div key={group.title} className="flex flex-col">
            <div className="bg-primary text-white text-center py-1 px-3 text-[10px] font-black uppercase tracking-widest rounded-t-sm">
                {group.title}
            </div>
            <div className="bg-slate-50/30 border-x border-b border-slate-200 border-t-0 p-3 grid gap-3 grid-cols-1 rounded-b-sm">
                {group.items.map((item: any) => (
                    <div
                        key={item.title}
                        className={`
                            relative bg-white border-x border-b border-primary/40 border-t-[6px] border-t-primary rounded shadow-sm 
                            transition-all duration-200 flex flex-col items-center justify-center gap-0.5 text-center py-5 px-3 min-h-[110px]
                            ${item.disabled
                                ? 'opacity-40 cursor-not-allowed border-slate-200 border-t-slate-300'
                                : 'hover:shadow-md hover:bg-slate-50 cursor-pointer active:scale-[0.98]'}
                        `}
                        onClick={!item.disabled ? item.action : undefined}
                    >
                        {item.key && (
                            <div className="absolute top-1 right-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-none">
                                {item.key}
                            </div>
                        )}
                        <div className="text-4xl">
                            {item.emoji}
                        </div>
                        <h3 className="text-xs font-black text-primary uppercase tracking-tight leading-tight">
                            {item.title}
                        </h3>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 bg-white overflow-hidden p-3 h-full">
            <TillAdminMenu isOpen={showTillAdmin} onClose={() => setShowTillAdmin(false)} />

            <div className="mb-6 shrink-0">
                <h1 className="text-3xl font-black text-primary uppercase tracking-tight border-b-4 border-primary inline-block pb-1">
                    Vision Point of Sale Menu
                </h1>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Column 1 */}
                    <div className="flex flex-col gap-3">
                        {column1.map(renderGroup)}
                    </div>

                    {/* Column 2 */}
                    <div className="flex flex-col gap-3">
                        {column2.map(renderGroup)}
                    </div>

                    {/* Column 3 */}
                    <div className="flex flex-col gap-3">
                        {column3.map(renderGroup)}
                    </div>

                    {/* Column 4 */}
                    <div className="flex flex-col gap-3">
                        {column4.map(renderGroup)}
                    </div>
                </div>
            </div>
        </div>
    );
};
