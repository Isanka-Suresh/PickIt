import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

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

    // Fetch pending orders count
    const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', branch?.id || '')
        .neq('status', 'completed')

    const stats = [
        {
            label: 'Total Products',
            value: productsCount?.toString() || '0',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            color: 'from-cyan-500 to-blue-500',
            href: '/manager/products'
        },
        {
            label: 'Total Employees',
            value: employeesCount?.toString() || '0',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            color: 'from-purple-500 to-pink-500',
            href: '/manager/employees'
        },
        {
            label: 'Total Orders',
            value: ordersCount?.toString() || '0',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            color: 'from-amber-500 to-orange-500',
            href: '/manager/orders'
        },
        {
            label: 'Pending Orders',
            value: pendingCount?.toString() || '0',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'from-green-500 to-emerald-500',
            href: '/manager/orders'
        },
    ]

    const quickActions = [
        {
            label: 'View Orders',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            href: '/manager/orders'
        },
        {
            label: 'Manage Products',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            href: '/manager/products'
        },
        {
            label: 'Manage Employees',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            href: '/manager/employees'
        },
        {
            label: 'View Reports',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            href: '/manager'
        },
    ]

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 p-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                    Welcome back, {profile?.full_name || user?.email?.split('@')[0]}
                </h2>
                <p className="text-gray-400 text-lg">
                    {branch ? `Managing ${branch.name}` : 'No branch assigned yet'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Link
                        key={index}
                        href={stat.href}
                        className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white`}>
                                {stat.icon}
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                href={action.href}
                                className="bg-white/5 hover:bg-white/10 rounded-xl p-5 text-white transition-all duration-200 border border-white/10 hover:border-cyan-500/30 group text-center"
                            >
                                <div className="flex justify-center mb-3 text-gray-400 group-hover:text-cyan-400 transition-colors">
                                    {action.icon}
                                </div>
                                <span className="text-sm font-medium block">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Branch Info */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Branch Information</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                            <svg className="w-5 h-5 text-cyan-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-400 mb-1">Branch Name</p>
                                <p className="text-sm font-medium text-white truncate">{branch?.name || 'Not assigned'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                            <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-400 mb-1">Manager</p>
                                <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'You'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Access Info */}
            <div className="backdrop-blur-xl bg-cyan-500/10 rounded-2xl border border-cyan-500/20 p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-xl">
                        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-cyan-400 font-semibold text-lg mb-1">Manager Access</h4>
                        <p className="text-gray-400">
                            You have full access to manage products, employees, and orders for your branch. Use the navigation menu to access different sections.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
