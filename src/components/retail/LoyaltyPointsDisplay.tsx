import React from 'react';
import { Customer } from '../../types/domain.types';
import { getTierColor } from '../../utils/retail.utils';

export const LoyaltyPointsDisplay = ({ customer, pointsEarned = 0 }: { customer: Customer | null, pointsEarned?: number }) => {
    if (!customer || customer.id === 'CASH' || !customer.loyalty) return null;

    const { loyalty } = customer;
    const tierColor = getTierColor(loyalty.tier);

    return (
        <div className="loyalty-display">
            <div className="loyalty-header">
                <div className="tier-badge" style={{ backgroundColor: tierColor }}>
                    <span className="tier-icon">
                        {loyalty.tier === 'Gold' ? '👑' : loyalty.tier === 'Platinum' ? '💎' : loyalty.tier === 'Silver' ? '🥈' : '🥉'}
                    </span>
                    <span className="tier-name">{loyalty.tier} Member</span>
                </div>
                <span className="member-since">Since {new Date(loyalty.memberSince).getFullYear()}</span>
            </div>

            <div className="points-section">
                <div className="points-balance">
                    <span className="points-value">{loyalty.pointsBalance.toLocaleString()}</span>
                    <span className="points-label">Points</span>
                </div>
                {pointsEarned > 0 && (
                    <div className="points-earned">
                        <span className="earned-value">+{pointsEarned}</span>
                        <span className="earned-label">This sale</span>
                    </div>
                )}
                {loyalty.pendingRewards > 0 && (
                    <div className="rewards-available">
                        <span className="rewards-value">R{loyalty.pendingRewards.toFixed(2)}</span>
                        <span className="rewards-label">Redeemable</span>
                    </div>
                )}
            </div>

            <div className="tier-progress">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${loyalty.tierProgress}%`, backgroundColor: tierColor }}></div>
                </div>
                <span className="progress-text">{loyalty.pointsToNextTier.toLocaleString()} points to next tier</span>
            </div>
        </div>
    );
};
