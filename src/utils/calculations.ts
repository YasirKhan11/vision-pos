import { CartItem } from '../types/domain.types';

export const calculateLineDiscount = (item: CartItem) => {
    const lineTotal = item.price * item.quantity;
    if (item.discountType === 'P') {
        return (lineTotal * item.discount) / 100;
    }
    return Math.min(item.discount, lineTotal);
};
