'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRealtimeOrders } from './useRealtimeOrders'
import OrderCard from './OrderCard'

type OrderStatus = 'created' | 'assigned' | 'processing' | 'ready' | 'completed'

interface OrderItem {
    id: string
    product_id: string
    quantity: number
    products: {
        name: string
        price: number
    }
}

interface OrderAssignment {
    id: string
    employee_id: string
    employees: {
        employee_code: string
        full_name: string
    }
}

interface Order {
    id: string
    customer_id: string
    status: OrderStatus
    scheduled_time: string | null
    created_at: string
    order_items: OrderItem[]
    order_assignments: OrderAssignment[]
    profiles: {
        full_name: string | null
        username: string | null
    }
}

interface Employee {
    id: string
    employee_code: string
    full_name: string
    is_active: boolean
}

interface OrdersClientProps {
    initialOrders: Order[]
    branchId: string
    employees: Employee[]
}

export default function OrdersClient({ initialOrders, branchId, employees }: OrdersClientProps) {
    const router = useRouter()
    const orders = useRealtimeOrders(branchId, initialOrders)
    const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')

    const filteredOrders = orders.filter(order => {
        if (statusFilter === 'all') return true
        return order.status === statusFilter
    })

    const statusCounts = {
        all: orders.length,
        created: orders.filter(o => o.status === 'created').length,
        assigned: orders.filter(o => o.status === 'assigned').length,
        processing: orders.filter(o => o.status === 'processing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        completed: orders.filter(o => o.status === 'completed').length,
    }

    const handleUpdate = () => {
        // Use Next.js router refresh to get fresh data from server
        router.refresh()
    }

    return (
        <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`backdrop-blur-xl border rounded-2xl p-4 transition-all duration-200 text-left ${statusFilter === 'all'
                        ? 'bg-cyan-500/20 border-cyan-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                >
                    <p className="text-xs text-gray-400 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-white">{statusCounts.all}</p>
                </button>
                <button
                    onClick={() => setStatusFilter('created')}
                    className={`backdrop-blur-xl border rounded-2xl p-4 transition-all duration-200 text-left ${statusFilter === 'created'
                        ? 'bg-blue-500/20 border-blue-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                >
                    <p className="text-xs text-blue-400 mb-1">Created</p>
                    <p className="text-2xl font-bold text-white">{statusCounts.created}</p>
                </button>
                <button
                    onClick={() => setStatusFilter('assigned')}
                    className={`backdrop-blur-xl border rounded-2xl p-4 transition-all duration-200 text-left ${statusFilter === 'assigned'
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                >
                    <p className="text-xs text-purple-400 mb-1">Assigned</p>
                    <p className="text-2xl font-bold text-white">{statusCounts.assigned}</p>
                </button>
                <button
                    onClick={() => setStatusFilter('processing')}
                    className={`backdrop-blur-xl border rounded-2xl p-4 transition-all duration-200 text-left ${statusFilter === 'processing'
                        ? 'bg-amber-500/20 border-amber-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                >
                    <p className="text-xs text-amber-400 mb-1">Processing</p>
                    <p className="text-2xl font-bold text-white">{statusCounts.processing}</p>
                </button>
                <button
                    onClick={() => setStatusFilter('ready')}
                    className={`backdrop-blur-xl border rounded-2xl p-4 transition-all duration-200 text-left ${statusFilter === 'ready'
                        ? 'bg-cyan-500/20 border-cyan-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                >
                    <p className="text-xs text-cyan-400 mb-1">Ready</p>
                    <p className="text-2xl font-bold text-white">{statusCounts.ready}</p>
                </button>
                <button
                    onClick={() => setStatusFilter('completed')}
                    className={`backdrop-blur-xl border rounded-2xl p-4 transition-all duration-200 text-left ${statusFilter === 'completed'
                        ? 'bg-green-500/20 border-green-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                >
                    <p className="text-xs text-green-400 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-white">{statusCounts.completed}</p>
                </button>
            </div>

            {/* Orders List */}
            {filteredOrders.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            employees={employees}
                            onUpdate={handleUpdate}
                        />
                    ))}
                </div>
            ) : (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Orders Found</h3>
                    <p className="text-gray-400">
                        {statusFilter !== 'all'
                            ? `No orders with status "${statusFilter}"`
                            : 'Waiting for customers to place orders...'
                        }
                    </p>
                </div>
            )}
        </>
    )
}
