import { createClient } from '@/utils/supabase/server'

export default async function ManagerDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch profile with full name
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single()

    // Fetch branch info where user is manager
    const { data: branch } = await supabase
        .from('branches')
        .select('id, name, supermarket_id')
        .eq('manager_id', user?.id)
        .single()

    // Fetch products count for the branch
    const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', branch?.id || '')

    // Fetch employees count for the branch
    const { count: employeesCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', branch?.id || '')

    // Fetch orders count for the branch
    const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', branch?.id || '')

    const stats = [
        { label: 'Products', value: productsCount?.toString() || '0', icon: '📦', color: 'from-cyan-500 to-blue-500' },
        { label: 'Employees', value: employeesCount?.toString() || '0', icon: '👥', color: 'from-purple-500 to-pink-500' },
        { label: 'Orders', value: ordersCount?.toString() || '0', icon: '📋', color: 'from-amber-500 to-orange-500' },
        { label: 'Pending', value: '0', icon: '⏳', color: 'from-green-500 to-emerald-500' },
    ]

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl border border-cyan-500/20 p-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome back, {profile?.full_name || user?.email?.split('@')[0]}! 👋
                </h2>
                <p className="text-gray-400">
                    {branch ? `Managing ${branch.name}` : 'No branch assigned yet.'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">{stat.icon}</span>
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.color}`} />
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'View Orders', icon: '📋', href: '/manager/orders' },
                            { label: 'Add Product', icon: '➕', href: '/manager/products' },
                            { label: 'Add Employee', icon: '👤', href: '/manager/employees' },
                            { label: 'Inventory', icon: '📊', href: '/manager/products' },
                        ].map((action, index) => (
                            <a
                                key={index}
                                href={action.href}
                                className="bg-white/5 hover:bg-white/10 rounded-xl p-4 text-white text-left transition-all duration-200 border border-white/10"
                            >
                                <span className="text-2xl block mb-2">{action.icon}</span>
                                <span className="text-sm font-medium">{action.label}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Pending Orders */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Pending Orders</h3>
                    <div className="space-y-4">
                        <p className="text-gray-500 text-sm text-center py-8">
                            No pending orders at the moment.
                        </p>
                    </div>
                </div>
            </div>

            {/* Manager Badge */}
            <div className="backdrop-blur-xl bg-cyan-500/10 rounded-2xl border border-cyan-500/30 p-6">
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                        <h4 className="text-cyan-400 font-semibold">Manager Access</h4>
                        <p className="text-gray-400 text-sm">
                            You can manage products, employees, and orders for your branch.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
