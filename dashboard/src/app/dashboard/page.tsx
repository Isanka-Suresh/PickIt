import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const stats = [
        { label: 'Total Users', value: '2,651', change: '+12.5%', positive: true },
        { label: 'Revenue', value: '$45,231', change: '+8.2%', positive: true },
        { label: 'Orders', value: '1,234', change: '-2.4%', positive: false },
        { label: 'Conversion', value: '3.2%', change: '+1.1%', positive: true },
    ]

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-3xl border border-white/10 p-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                    Good to see you, {user?.email?.split('@')[0]}! 👋
                </h2>
                <p className="text-gray-400">
                    Here&apos;s what&apos;s happening with your projects today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300"
                    >
                        <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
                        <span className={`text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                            {stat.change} from last month
                        </span>
                    </div>
                ))}
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {[
                            { action: 'New user registered', time: '2 minutes ago', icon: '👤' },
                            { action: 'Order #1234 completed', time: '15 minutes ago', icon: '📦' },
                            { action: 'Payment received', time: '1 hour ago', icon: '💰' },
                            { action: 'New review submitted', time: '3 hours ago', icon: '⭐' },
                        ].map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                <span className="text-2xl">{item.icon}</span>
                                <div className="flex-1">
                                    <p className="text-white text-sm">{item.action}</p>
                                    <p className="text-gray-500 text-xs">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Create Order', icon: '➕', color: 'from-purple-500 to-purple-600' },
                            { label: 'Add Product', icon: '📦', color: 'from-cyan-500 to-cyan-600' },
                            { label: 'View Reports', icon: '📊', color: 'from-pink-500 to-pink-600' },
                            { label: 'Manage Users', icon: '👥', color: 'from-orange-500 to-orange-600' },
                        ].map((action, index) => (
                            <button
                                key={index}
                                className={`bg-gradient-to-r ${action.color} rounded-xl p-4 text-white text-left hover:scale-105 transition-transform duration-200 shadow-lg`}
                            >
                                <span className="text-2xl block mb-2">{action.icon}</span>
                                <span className="text-sm font-medium">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Protected Content Notice */}
            <div className="backdrop-blur-xl bg-green-500/10 rounded-2xl border border-green-500/30 p-6">
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                        <h4 className="text-green-400 font-semibold">Protected Route</h4>
                        <p className="text-gray-400 text-sm">
                            This page is only accessible to authenticated users. Your session is secured with Supabase.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
