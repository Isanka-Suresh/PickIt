
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

type OrderStatus = 'received' | 'preparing' | 'done' | 'collected';

const STATUS_MESSAGES: Record<OrderStatus, { title: string; message: string }> = {
    received: { title: '📥 Order Received', message: 'Your order has been received by the store.' },
    preparing: { title: '🧺 Order Preparing', message: 'The store team is picking up your items now!' },
    done: { title: '✅ Order Ready!', message: 'Your order is ready. Head over to collect it!' },
    collected: { title: '🛍️ Order Collected', message: 'Your order has been collected. Enjoy!' },
};

/**
 * Registers a global Supabase Realtime subscription for the current user's orders.
 * Shows a React Native Alert whenever an order's status changes.
 * Should be mounted inside AppStack so it runs for the entire authenticated session.
 */
export function useOrderNotifications(userId: string | undefined) {
    // Track which (orderId, status) pairs we've already notified to avoid duplicates on reconnect
    const notifiedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`order-notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `customer_id=eq.${userId}`,
                },
                (payload) => {
                    const { id, status } = payload.new as { id: string; status: OrderStatus };
                    const notifyKey = `${id}-${status}`;

                    if (notifiedRef.current.has(notifyKey)) return;
                    notifiedRef.current.add(notifyKey);

                    const cfg = STATUS_MESSAGES[status];
                    if (!cfg) return;

                    Alert.alert(cfg.title, cfg.message, [{ text: 'OK' }]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);
}
