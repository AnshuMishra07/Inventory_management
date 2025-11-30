/**
 * Currency formatting utility for INR
 */

export const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

export const formatCurrencyCompact = (amount: number): string => {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(2)}K`;
    }
    return formatCurrency(amount);
};

export const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[₹,]/g, '')) || 0;
};
