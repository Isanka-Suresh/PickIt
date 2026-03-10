import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export default async function OwnerDashboardPage() {
    // Use regular client for auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Use admin client for data fetching (bypasses RLS)
    const adminClient = createAdminClient()

    // Fetch all stats in parallel — dramatically faster than sequential awaits
    const [
        { data: profile },
        { count: supermarketsCount, error: supermarketsError },
        { count: branchesCount },
        { count: ordersCount },
    ] = await Promise.all([
        adminClient.from('profiles').select('full_name').eq('id', user?.id).single(),
        adminClient.from('supermarkets').select('*', { count: 'exact', head: true }),
        adminClient.from('branches').select('*', { count: 'exact', head: true }),
        adminClient.from('orders').select('*', { count: 'exact', head: true }),
    ])

    if (supermarketsError) {
        console.error('Error fetching supermarkets:', supermarketsError)
    }

    const stats = [
        { label: 'Supermarkets', value: supermarketsCount?.toString() || '0', icon: '🏪', color: 'from-amber-500 to-orange-500' },
        { label: 'Branches', value: branchesCount?.toString() || '0', icon: '📍', color: 'from-purple-500 to-pink-500' },
        { label: 'Total Orders', value: ordersCount?.toString() || '0', icon: '📦', color: 'from-cyan-500 to-blue-500' },
        { label: 'Revenue', value: '$0', icon: '💰', color: 'from-green-500 to-emerald-500' },
    ]

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="backdrop-blur-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl border border-amber-500/20 p-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome back, {profile?.full_name || user?.email?.split('@')[0]}! 👋
                </h2>
                <p className="text-gray-400">
                    Manage your supermarket empire from here.
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
                            { label: 'Add Supermarket', icon: '➕', href: '/owner/supermarkets' },
                            { label: 'Add Branch', icon: '🏬', href: '/owner/branches' },
                            { label: 'Assign Manager', icon: '👤', href: '/owner/managers' },
                            { label: 'View Orders', icon: '📋', href: '/owner/orders' },
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

                {/* Recent Activity */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5">
                            <span className="text-2xl">📊</span>
                            <div className="flex-1">
                                <p className="text-white text-sm">Dashboard loaded</p>
                                <p className="text-gray-500 text-xs">Just now</p>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm text-center py-4">
                            Activity will appear here as you use the system.
                        </p>
                    </div>
                </div>
            </div>

            {/* Owner Badge */}
            <div className="backdrop-blur-xl bg-amber-500/10 rounded-2xl border border-amber-500/30 p-6">
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                        <h4 className="text-amber-400 font-semibold">Owner Access</h4>
                        <p className="text-gray-400 text-sm">
                            You have full access to manage supermarkets, branches, and managers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
