'use client'

import { useState } from 'react'
import StatusBadge from './StatusBadge'
import { updateOrderStatus, assignEmployeeToOrder, unassignEmployeeFromOrder } from './actions'

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

interface OrderCardProps {
    order: Order
    employees: Employee[]
    onUpdate: () => void
}

const statusFlow: OrderStatus[] = ['created', 'assigned', 'processing', 'ready', 'completed']

export default function OrderCard({ order, employees, onUpdate }: OrderCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [assigning, setAssigning] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)

    const currentStatusIndex = statusFlow.indexOf(order.status)
    const nextStatus = currentStatusIndex < statusFlow.length - 1 ? statusFlow[currentStatusIndex + 1] : null

    const handleStatusUpdate = async () => {
        if (!nextStatus) return

        setUpdating(true)
        const result = await updateOrderStatus(order.id, nextStatus)

        if (result.success) {
            onUpdate()
        } else {
            alert(result.error || 'Failed to update status')
        }
        setUpdating(false)
    }

    const handleAssignEmployee = async (employeeId: string) => {
        setAssigning(true)
        const result = await assignEmployeeToOrder(order.id, employeeId)

        if (result.success) {
            onUpdate()
            setShowAssignModal(false)
        } else {
            alert(result.error || 'Failed to assign employee')
        }
        setAssigning(false)
    }

    const handleUnassign = async (employeeId: string) => {
        const result = await unassignEmployeeFromOrder(order.id, employeeId)

        if (result.success) {
            onUpdate()
        } else {
            alert(result.error || 'Failed to unassign employee')
        }
    }

    const orderTotal = order.order_items.reduce(
        (sum, item) => sum + item.products.price * item.quantity,
        0
    )

    const customerName = order.profiles.full_name || order.profiles.username || 'Unknown Customer'

    return (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-200">
            {/* Header */}
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                            Order #{order.id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-gray-400">Customer: {customerName}</p>
                    </div>
                    <StatusBadge status={order.status} />
                </div>

                {/* Order Summary */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                        <p className="text-xl font-bold text-white">${orderTotal.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Items</p>
                        <p className="text-xl font-bold text-white">{order.order_items.length}</p>
                    </div>
                </div>

                {/* Assigned Employees */}
                {order.order_assignments.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Assigned Employees</p>
                        <div className="flex flex-wrap gap-2">
                            {order.order_assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-1"
                                >
                                    <span className="text-sm text-cyan-400">
                                        {assignment.employees.full_name}
                                    </span>
                                    <button
                                        onClick={() => handleUnassign(assignment.employee_id)}
                                        className="text-cyan-400 hover:text-cyan-300"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    {nextStatus && order.status !== 'completed' && (
                        <button
                            onClick={handleStatusUpdate}
                            disabled={updating}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl transition-all duration-200 text-sm font-medium disabled:opacity-50"
                        >
                            {updating ? 'Updating...' : `Mark as ${nextStatus}`}
                        </button>
                    )}
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="flex-1 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl transition-all duration-200 text-sm font-medium border border-purple-500/20"
                    >
                        Assign Employee
                    </button>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-200"
                    >
                        <svg
                            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="border-t border-white/10 p-6 bg-black/20">
                    <h4 className="text-sm font-semibold text-white mb-3">Order Items</h4>
                    <div className="space-y-2">
                        {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-300">
                                    {item.products.name} × {item.quantity}
                                </span>
                                <span className="text-white font-medium">
                                    ${(item.products.price * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                        <span className="text-gray-400 font-medium">Total</span>
                        <span className="text-white font-bold">${orderTotal.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Assign Employee Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Assign Employee</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {employees.filter(e => e.is_active).length > 0 ? (
                                employees
                                    .filter(e => e.is_active)
                                    .map((employee) => {
                                        const isAssigned = order.order_assignments.some(
                                            a => a.employee_id === employee.id
                                        )
                                        return (
                                            <button
                                                key={employee.id}
                                                onClick={() => handleAssignEmployee(employee.id)}
                                                disabled={assigning || isAssigned}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${isAssigned
                                                        ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                                                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                                                    } disabled:opacity-50`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">{employee.full_name}</p>
                                                        <p className="text-sm text-gray-400">{employee.employee_code}</p>
                                                    </div>
                                                    {isAssigned && <span className="text-xs">✓ Assigned</span>}
                                                </div>
                                            </button>
                                        )
                                    })
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">
                                    No active employees available
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowAssignModal(false)}
                            disabled={assigning}
                            className="w-full mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
