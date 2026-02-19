import React from 'react';
import { Customer } from '../../types/domain.types';
import { getRfmSegmentInfo } from '../../utils/retail.utils';

export const CustomerInsightsPanel = ({ customer }: { customer: Customer | null }) => {
    if (!customer || customer.id === 'CASH' || !customer.insights) return null;

    const { insights } = customer;
    const rfmInfo = getRfmSegmentInfo(insights.rfmSegment);

    return (
        <div className="customer-insights-panel">
            <div className="insights-header">
                <div className="customer-segment" style={{ backgroundColor: rfmInfo.bg, color: rfmInfo.color }}>
                    <span className="segment-icon">{rfmInfo.icon}</span>
                    <span className="segment-label">{insights.rfmSegment}</span>
                </div>
                {insights.daysSinceLastVisit > 30 && (
                    <div className="alert-badge at-risk">
                        ⚠️ {insights.daysSinceLastVisit} days since last visit
                    </div>
                )}
            </div>

            <div className="insights-stats">
                <div className="stat-item">
                    <span className="stat-label">Last Visit</span>
                    <span className="stat-value">{insights.daysSinceLastVisit === 0 ? 'Today' : `${insights.daysSinceLastVisit} days ago`}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Transactions</span>
                    <span className="stat-value">{insights.totalTransactions}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Total Spend</span>
                    <span className="stat-value">R{insights.totalSpend.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Avg Basket</span>
                    <span className="stat-value">R{insights.averageBasket.toFixed(2)}</span>
                </div>
            </div>

            {insights.topProducts.length > 0 && (
                <div className="top-products-hint">
                    <span className="hint-icon">💡</span>
                    <span>Usually buys: {insights.topProducts.slice(0, 3).join(', ')}</span>
                </div>
            )}
        </div>
    );
};
