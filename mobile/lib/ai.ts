/**
 * PickIt AI / Recommendation Service client
 * ==========================================
 *
 * Connects to the FastAPI ML service running in ml_service/.
 *
 * Local dev (Android Emulator): http://10.0.2.2:8000  (= localhost on host machine)
 * Physical device / iOS:        Set EXPO_PUBLIC_AI_URL to your machine's LAN IP or an ngrok URL.
 *   e.g.  EXPO_PUBLIC_AI_URL=http://192.168.1.42:8000
 * Google Colab:                 EXPO_PUBLIC_AI_URL=<ngrok public URL printed by Colab cell>
 */

import { supabase } from '../src/lib/supabase';
import { Product } from '../src/context/CartProvider';

const AI_BASE_URL = process.env.EXPO_PUBLIC_AI_URL ?? 'http://10.0.2.2:8000';
const TIMEOUT_MS = 10000; // 10 s — gives the service time on first cold boot

// ── Types returned by the ML API ──────────────────────────────────────────────

export type RecommendationItem = {
    product_id: string;
    product_name: string;
    reason?: string;
    confidence?: number;
    lift?: number;
    score?: number;
    similarity?: number;
};

export type ComboResponse = {
    type: 'combo';
    recommendations: RecommendationItem[];
};

export type PersonalResponse = {
    type: 'personal';
    cold_start: boolean;
    recommendations: RecommendationItem[];
};

export type SubstituteResponse = {
    type: 'substitute';
    out_of_stock: { product_id: string; product_name: string };
    recommendations: RecommendationItem[];
};

// ── Internal helpers ──────────────────────────────────────────────────────────

function fetchWithTimeout(url: string, ms = TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

/**
 * Given a list of product UUIDs returned by the ML API,
 * fetch the full Product rows from Supabase.
 *
 * Strategy:
 *  1. Look up by exact ML UUID (works when user is on Branch A).
 *  2. If step 1 returns nothing (user is on Branch B/C whose products have
 *     different auto-generated UUIDs), fall back to a name-based lookup
 *     inside the user's branch so recommendations still resolve correctly.
 * Results are returned in the ML-ranked order.
 */
async function resolveProducts(ids: string[], branchId?: string): Promise<Product[]> {
    if (ids.length === 0) return [];

    console.log(`[AI] resolveProducts: ids=${ids.length}, branch=${branchId ?? 'none'}`);

    // ── Step 1: exact UUID lookup (Branch A path) ───────────────────
    let query = supabase
        .from('products')
        .select('*')
        .in('id', ids)
        .eq('is_active', true);

    if (branchId) query = query.eq('branch_id', branchId);

    const { data: exactData, error: exactError } = await query;
    if (exactError) {
        console.error('[AI] resolveProducts error:', exactError.message);
        return [];
    }

    console.log(`[AI] step1 exact match: ${exactData?.length ?? 0} products`);

    if (exactData && exactData.length > 0) {
        const map = new Map((exactData as Product[]).map(p => [p.id, p]));
        return ids.map(id => map.get(id)).filter(Boolean) as Product[];
    }

    // ── Step 2: name-based fallback (Branch B / C path) ─────────────
    const { data: nameSource } = await supabase
        .from('products')
        .select('id, name')
        .in('id', ids);

    console.log(`[AI] step2 nameSource (any branch): ${nameSource?.length ?? 0} products`);

    if (!nameSource || nameSource.length === 0) {
        console.warn('[AI] DB has no products with these ML IDs — seed the database!');
        return [];
    }

    const mlNames = nameSource.map((p: { id: string; name: string }) => p.name);

    let nameQuery = supabase
        .from('products')
        .select('*')
        .in('name', mlNames)
        .eq('is_active', true);

    if (branchId) nameQuery = nameQuery.eq('branch_id', branchId);

    const { data: nameData, error: nameError } = await nameQuery;
    if (nameError) {
        console.error('[AI] resolveProducts name-fallback error:', nameError.message);
        return [];
    }

    console.log(`[AI] step2 name-fallback in branch: ${nameData?.length ?? 0} products`);

    if (!nameData || nameData.length === 0) return [];

    const mlNameOrder = nameSource.map((p: { id: string; name: string }) => p.name);
    const nameMap = new Map((nameData as Product[]).map(p => [p.name, p]));
    return mlNameOrder
        .map(name => nameMap.get(name))
        .filter(Boolean) as Product[];
}

// ── Public API functions ──────────────────────────────────────────────────────

/**
 * Combo recommendations (Apriori / market-basket analysis).
 * Call this when the user has items in the cart to suggest frequently bought-together products.
 *
 * @param cartItemIds  UUIDs of products currently in the cart.
 * @param branchId     Filter results to products available in this branch.
 * @param n            Number of recommendations to return (default 5).
 */
export async function getComboRecommendations(
    cartItemIds: string[],
    branchId?: string,
    n = 5,
): Promise<Product[]> {
    if (cartItemIds.length === 0) return [];
    try {
        const url = `${AI_BASE_URL}/recommend/combo?product_ids=${cartItemIds.join(',')}&n=${n}`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) { console.warn('[AI] combo non-200:', res.status); return []; }

        const body: ComboResponse = await res.json();
        const ids = body.recommendations.map(r => r.product_id);
        return resolveProducts(ids, branchId);
    } catch (err) {
        console.log('[AI] combo unavailable:', err);
        return [];
    }
}

/**
 * Combo recommendations enriched with reason labels from the ML model.
 * Useful when you want to display "Frequently bought with X" text.
 */
export async function getComboRecommendationsWithMeta(
    cartItemIds: string[],
    branchId?: string,
    n = 5,
): Promise<{ product: Product; reason: string }[]> {
    if (cartItemIds.length === 0) return [];
    try {
        const url = `${AI_BASE_URL}/recommend/combo?product_ids=${cartItemIds.join(',')}&n=${n}`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) return [];

        const body: ComboResponse = await res.json();
        const ids = body.recommendations.map(r => r.product_id);
        const products = await resolveProducts(ids, branchId);

        return products.map((product, i) => ({
            product,
            reason: body.recommendations[i]?.reason ?? 'Frequently bought together',
        }));
    } catch (err) {
        console.log('[AI] combo+meta unavailable:', err);
        return [];
    }
}

/**
 * Personalised recommendations (SVD collaborative filtering).
 * Call on the home screen for "Recommended for you".
 * Handles cold-start automatically — new users receive the most popular products.
 *
 * @param customerId   The logged-in user's UUID.
 * @param branchId     Filter results to products available in this branch.
 * @param n            Number of recommendations to return (default 8).
 * @returns            An object with the resolved Product array and a `coldStart` flag.
 */
export async function getPersonalRecommendations(
    customerId: string,
    branchId?: string,
    n = 8,
): Promise<{ products: Product[]; coldStart: boolean }> {
    try {
        const url =
            `${AI_BASE_URL}/recommend/personal` +
            `?customer_id=${encodeURIComponent(customerId)}&n=${n}&exclude_purchased=true`;

        const res = await fetchWithTimeout(url);
        if (!res.ok) { console.warn('[AI] personal non-200:', res.status); return { products: [], coldStart: false }; }

        const body: PersonalResponse = await res.json();
        const ids = body.recommendations.map(r => r.product_id);
        const products = await resolveProducts(ids, branchId);
        return { products, coldStart: body.cold_start };
    } catch (err) {
        console.log('[AI] personal unavailable:', err);
        return { products: [], coldStart: false };
    }
}

/**
 * Substitute recommendations (content-based cosine similarity).
 * Call when a product in the cart is out of stock to suggest alternatives.
 *
 * @param outOfStockProductId  UUID of the out-of-stock product.
 * @param inStockIds           UUIDs of products currently in stock (to filter results).
 * @param branchId             Filter results to products available in this branch.
 * @param n                    Number of substitutes to return (default 3).
 */
export async function getSubstituteRecommendations(
    outOfStockProductId: string,
    inStockIds: string[],
    branchId?: string,
    n = 3,
): Promise<Product[]> {
    try {
        let url =
            `${AI_BASE_URL}/recommend/substitute` +
            `?product_id=${encodeURIComponent(outOfStockProductId)}&n=${n}`;

        if (inStockIds.length > 0) {
            url += `&in_stock_ids=${inStockIds.join(',')}`;
        }

        const res = await fetchWithTimeout(url);
        if (!res.ok) { console.warn('[AI] substitute non-200:', res.status); return []; }

        const body: SubstituteResponse = await res.json();
        const ids = body.recommendations.map(r => r.product_id);
        return resolveProducts(ids, branchId);
    } catch (err) {
        console.log('[AI] substitute unavailable:', err);
        return [];
    }
}
