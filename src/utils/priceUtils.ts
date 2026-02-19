import { api } from '../api';
import { Product } from '../types/domain.types';

/**
 * Enriches a list of products with accurate prices from the stkprice API.
 * 
 * Logic:
 * 1. Collect unique linkCodes from the products.
 * 2. Fetch detailed prices for these linkCodes.
 * 3. Merge prices into the products:
 *    - If VAT Code is 'S' (Standard), use the 'incl' price.
 *    - If VAT Code is 'Z' (Zero-rated), use the 'excl' price.
 * 
 * @param products - The list of products to enrich.
 * @param priceCode - The price level to fetch (default: '01').
 * @returns A promise that resolves to the enriched product list.
 */
export const enrichProductsWithPrices = async (products: Product[], priceCode: string = '01'): Promise<Product[]> => {
    if (!products.length) return products;

    try {
        // 1. Collect unique stockCodes (filtering out null/undefined/empty)
        if (products.length > 0) {
            console.log('[PriceEnrichment] Products being processed:', products);
        }

        const stockCodes = Array.from(new Set(
            products.map(p => p.id).filter(id => id && id.trim() !== '') as string[]
        ));

        console.log(`[PriceEnrichment] Enriching ${products.length} products using stockCodes:`, stockCodes);

        if (!stockCodes.length) {
            console.log('[PriceEnrichment] No stockCodes found to enrich.');
            return products;
        }

        // 2. Fetch detailed prices
        const priceData = await api.stock.pricing.getDetailedPrices(stockCodes, priceCode);
        console.log(`[PriceEnrichment] Received ${priceData.length} price records from API using priceCode "${priceCode}".`);

        // 3. Create a lookup map for efficiency (matching by stockcode)
        const priceMap = new Map<string, any>(priceData.map((p: any) => [p.stockcode, p]));

        // 4. Enrich products
        return products.map(product => {
            const priceRecord = priceMap.get(product.id);
            if (!priceRecord) return product;

            // Apply VAT-aware price selection
            // 'S' = Standard (Show Incl), 'Z' = Zero-rated (Show Excl)
            const vatCode = (product.vatCode || '').toString().toUpperCase().trim();
            let finalPrice = product.price;

            if (vatCode === 'S') {
                finalPrice = priceRecord.incl;
            } else if (vatCode === 'Z') {
                finalPrice = priceRecord.excl;
            } else {
                // Fallback to incl if unknown standard, or keep original if no better info
                finalPrice = priceRecord.incl || product.price;
            }

            // EXTREMELY IMPORTANT: Update ALL properties that might be used for display
            return {
                ...product,
                price: finalPrice,
                sugsell: finalPrice,
                STKPRICE1: finalPrice,
                detailedPrice: priceRecord // Keep the full record for reference
            };
        });
    } catch (error) {
        console.error('[PriceEnrichment] Failed to enrich products with prices:', error);
        return products;
    }
};
