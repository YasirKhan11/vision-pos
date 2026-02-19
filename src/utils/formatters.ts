export const formatCurrency = (amount: any) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'R 0.00';
    return `R ${Number(amount).toFixed(2)}`;
};
