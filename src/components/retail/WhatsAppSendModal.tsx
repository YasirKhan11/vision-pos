import React from 'react';
import { Modal } from '../common/Modal';
import { Customer, WhatsAppTemplate } from '../../types/domain.types';

export const WhatsAppSendModal = ({
    isOpen,
    onClose,
    template,
    customer,
    onConfirmSend
}: {
    isOpen: boolean,
    onClose: () => void,
    template: WhatsAppTemplate | null,
    customer: Customer | null,
    onConfirmSend: () => void
}) => {
    if (!template || !customer) return null;

    const formatMessage = () => {
        let msg = template.message;
        msg = msg.replace('{customer_name}', customer.contactPerson || customer.name.split(' ')[0]);
        msg = msg.replace('{points_earned}', '0');
        msg = msg.replace('{points_balance}', customer.loyalty?.pointsBalance.toString() || '0');
        msg = msg.replace('{new_tier}', customer.loyalty?.tier || 'Bronze');
        msg = msg.replace('{expiring_points}', '500');
        msg = msg.replace('{days}', '7');
        msg = msg.replace('{reward_value}', '50.00');
        return msg;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send WhatsApp Message" size="medium">
            <div className="wa-send-preview">
                <div className="wa-recipient">
                    <span className="wa-recipient-label">To:</span>
                    <span className="wa-recipient-name">{customer.name}</span>
                    <span className="wa-recipient-number">+{customer.whatsapp}</span>
                </div>

                <div className="wa-message-preview">
                    <div className="wa-message-bubble">
                        {formatMessage()}
                    </div>
                </div>

                <div className="wa-send-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-success" onClick={onConfirmSend}>
                        <span>📱</span> Send via WhatsApp
                    </button>
                </div>
            </div>
        </Modal>
    );
};
