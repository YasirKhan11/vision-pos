import React, { useState } from 'react';
import { Customer, WhatsAppTemplate } from '../../types/domain.types';
import { WHATSAPP_TEMPLATES } from '../../data/mockData';

export const WhatsAppQuickActions = ({
    customer,
    saleTotal = 0,
    pointsEarned = 0,
    onSendMessage
}: {
    customer: Customer | null,
    saleTotal?: number,
    pointsEarned?: number,
    onSendMessage: (template: WhatsAppTemplate, customer: Customer) => void
}) => {
    if (!customer || customer.id === 'CASH' || !customer.whatsapp) return null;

    const [showTemplates, setShowTemplates] = useState(false);

    const activeTemplates = WHATSAPP_TEMPLATES.filter(t => t.active);

    // Check for triggered templates
    const triggeredAlerts: { template: WhatsAppTemplate; reason: string }[] = [];

    if (customer.insights && customer.insights.daysSinceLastVisit >= 30) {
        const missYou = activeTemplates.find(t => t.trigger === 'days_inactive');
        if (missYou) triggeredAlerts.push({ template: missYou, reason: `${customer.insights.daysSinceLastVisit} days inactive` });
    }

    // Check if birthday is this month
    if (customer.birthday) {
        const bday = new Date(customer.birthday);
        const today = new Date();
        if (bday.getMonth() === today.getMonth()) {
            const bdayTemplate = activeTemplates.find(t => t.trigger === 'birthday');
            if (bdayTemplate) triggeredAlerts.push({ template: bdayTemplate, reason: 'Birthday this month!' });
        }
    }

    return (
        <div className="whatsapp-quick-actions">
            <div className="wa-header" onClick={() => setShowTemplates(!showTemplates)}>
                <span className="wa-icon">📱</span>
                <span className="wa-title">WhatsApp</span>
                {triggeredAlerts.length > 0 && (
                    <span className="wa-alert-badge">{triggeredAlerts.length}</span>
                )}
                <span className="wa-toggle">{showTemplates ? '▲' : '▼'}</span>
            </div>

            {showTemplates && (
                <div className="wa-templates-list">
                    {triggeredAlerts.length > 0 && (
                        <div className="wa-triggered-section">
                            <div className="wa-section-label">⚡ Suggested Messages</div>
                            {triggeredAlerts.map(alert => (
                                <div key={alert.template.id} className="wa-template-item suggested">
                                    <div className="wa-template-info">
                                        <span className="wa-template-name">{alert.template.name}</span>
                                        <span className="wa-template-reason">{alert.reason}</span>
                                    </div>
                                    <button
                                        className="wa-send-btn"
                                        onClick={() => onSendMessage(alert.template, customer)}
                                    >
                                        Send
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="wa-section-label">All Templates</div>
                    {activeTemplates.slice(0, 4).map(template => (
                        <div key={template.id} className="wa-template-item">
                            <span className="wa-template-name">{template.name}</span>
                            <button
                                className="wa-send-btn"
                                onClick={() => onSendMessage(template, customer)}
                            >
                                Send
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
