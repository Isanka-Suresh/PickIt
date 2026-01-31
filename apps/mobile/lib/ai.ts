
import { supabase } from './supabase';
import { Product } from '../src/context/CartProvider';

// Using 10.0.2.2 for Android Emulator to access localhost
const AI_SERVICE_URL = process.env.EXPO_PUBLIC_AI_URL || 'http://10.0.2.2:8000';

export async function getRecommendations(cartItemIds: string[], branchId?: string): Promise<Product[]> {
    if (cartItemIds.length === 0) return [];

    try {
        console.log('Fetching recommendations for:', cartItemIds);

        // 1. Call AI Service
        // We use a timeout to fail fast if service is down
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch(`${AI_SERVICE_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item_ids: cartItemIds }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn('AI Service Response not OK:', response.status);
            return [];
        }

        const data = await response.json();
        const recommendedIds: string[] = data.recommended_ids || [];

        if (recommendedIds.length === 0) return [];

        // 2. Fetch Details from Supabase
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .in('id', recommendedIds)
            .eq('branch_id', branchId); // Ensure we only recommend items available in this branch

        if (error) {
            console.error('Error fetching recommended product details:', error);
            return [];
        }

        return (products as unknown as Product[]) || [];

    } catch (error) {
        // Fail gracefully (e.g. network error, service down)
        console.log('AI Service unavailable or failed:', error);
        return [];
    }
}
