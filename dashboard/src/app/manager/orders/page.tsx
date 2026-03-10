import { createClient } from '@/utils/supabase/server'
import OrdersClient from './OrdersClient'

export default async function OrdersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get manager's branch
    const { data: branch } = await supabase
        .from('branches')
        .select('id, name')
        .eq('manager_id', user?.id)
        .single()

    // Fetch orders for the branch with related data
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            *,
            profiles:customer_id (full_name, username),
            order_items (
                id,
                product_id,
                quantity,
                products (name, price)
            ),
            order_assignments (
                id,
                employee_id,
                employees (employee_code, full_name)
            )
        `)
        .eq('branch_id', branch?.id || '')
        .order('created_at', { ascending: false })

    // Fetch active employees for the branch
    const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('branch_id', branch?.id || '')
        .order('full_name')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Orders</h2>
                    <p className="text-gray-400">
                        {branch ? `Managing orders for ${branch.name}` : 'No branch assigned'}
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 text-sm font-medium">Live Updates</span>
                </div>
            </div>

            <OrdersClient
                initialOrders={orders || []}
                branchId={branch?.id || ''}
                employees={employees || []}
            />
        </div>
    )
}
