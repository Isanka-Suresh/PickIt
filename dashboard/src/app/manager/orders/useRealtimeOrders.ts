'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

// Using a generic so this hook preserves whatever Order shape the parent provides
// (including nested joins like order_items, order_assignments, profiles)
// while still being able to handle the partial updates from the realtime payload.
interface BaseOrder {
    id: string
    status: string
}

export function useRealtimeOrders<T extends BaseOrder>(branchId: string, initialOrders: T[]) {
    const [orders, setOrders] = useState<T[]>(initialOrders)
    const supabase = createClient()

    useEffect(() => {
        if (!branchId) return

        // Subscribe to orders changes for this branch
        const channel = supabase
            .channel('orders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `branch_id=eq.${branchId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // New orders from realtime won't have join data — they'll appear
                        // once the page is refreshed via router.refresh() in the parent.
                        // We cast here to satisfy TypeScript; the parent calls router.refresh() on updates.
                        setOrders((current) => [payload.new as T, ...current])
                    } else if (payload.eventType === 'UPDATE') {
                        setOrders((current) =>
                            current.map((order) =>
                                order.id === payload.new.id ? { ...order, ...payload.new } : order
                            )
                        )
                    } else if (payload.eventType === 'DELETE') {
                        setOrders((current) =>
                            current.filter((order) => order.id !== payload.old.id)
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [branchId, supabase])

    return orders
}
