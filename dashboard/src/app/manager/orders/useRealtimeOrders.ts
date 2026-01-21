'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Order {
    id: string
    customer_id: string
    status: string
    scheduled_time: string | null
    created_at: string
}

export function useRealtimeOrders(branchId: string, initialOrders: Order[]) {
    const [orders, setOrders] = useState<Order[]>(initialOrders)
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
                        setOrders((current) => [payload.new as Order, ...current])
                    } else if (payload.eventType === 'UPDATE') {
                        setOrders((current) =>
                            current.map((order) =>
                                order.id === payload.new.id ? (payload.new as Order) : order
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
