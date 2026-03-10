'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/auth/actions'

interface NavLinkProps {
    href: string
    icon: React.ReactNode
    label: string
    isActive: boolean
}

function NavLink({ href, icon, label, isActive }: NavLinkProps) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <div className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`}>
                {icon}
            </div>
            <span className="font-medium">{label}</span>
        </Link>
    )
}

export default function ManagerSidebar({
    profile,
    user,
}: {
    profile: { full_name: string | null; role: string } | null
    user: { id: string; email?: string }
}) {
    const pathname = usePathname()

    const navigation = [
        {
            href: '/manager',
            label: 'Dashboard',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            href: '/manager/orders',
            label: 'Orders',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
        },
        {
            href: '/manager/products',
            label: 'Products',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
        },
        {
            href: '/manager/employees',
            label: 'Employees',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
    ]

    return (
        <aside className="fixed inset-y-0 left-0 w-64 backdrop-blur-xl bg-slate-900/95 border-r border-white/10 z-30">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <div>
                    <span className="text-xl font-bold text-white">PickIt</span>
                    <span className="block text-xs text-cyan-400">Manager Portal</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="px-4 py-6 space-y-1">
                {navigation.map((item) => (
                    <NavLink
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        isActive={pathname === item.href}
                    />
                ))}
            </nav>

            {/* User section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-slate-900/80">
                <div className="flex items-center gap-3 px-2 py-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {profile?.full_name || user.email}
                        </p>
                        <p className="text-xs text-gray-400">Manager</p>
                    </div>
                </div>
                <form action={logout}>
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </form>
            </div>
        </aside>
    )
}
