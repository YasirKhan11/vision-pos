import React from 'react';
import { Product } from '../../types/domain.types';
import { PRODUCT_ASSOCIATIONS, MOCK_PRODUCTS, MOCK_PARTS } from '../../data/mockData';
import { formatCurrency } from '../../utils/formatters';

export const FrequentlyBoughtTogether = ({
    currentProductId,
    cartProductIds,
    onAddProduct
}: {
    currentProductId: string,
    cartProductIds: string[],
    onAddProduct: (product: Product) => void
}) => {
    const associations = PRODUCT_ASSOCIATIONS.find(a => a.productId === currentProductId);

    if (!associations) return null;

    // Filter out products already in cart
    const suggestions = associations.associatedProducts
        .filter(ap => !cartProductIds.includes(ap.productId))
        .slice(0, 2);

    if (suggestions.length === 0) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg shadow-black/5 flex-1 flex flex-col min-h-0">
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 shrink-0 flex items-center gap-2">
                <span className="text-sm">💡</span>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">Frequently Bought Together</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {suggestions.map(suggestion => {
                    const product = [...MOCK_PRODUCTS, ...MOCK_PARTS].find(p => p.id === suggestion.productId);
                    if (!product) return null;

                    return (
                        <div key={suggestion.productId} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary/30 transition-colors group">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-black text-slate-700 leading-tight group-hover:text-primary transition-colors">{suggestion.label}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{Math.round(suggestion.confidence * 100)}% of customers also buy</span>
                            </div>
                            <button
                                className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-primary hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 shadow-sm"
                                onClick={() => onAddProduct(product)}
                            >
                                + Add {formatCurrency ? formatCurrency(product.price) : `R${product.price.toFixed(2)}`}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
