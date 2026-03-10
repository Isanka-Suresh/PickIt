import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OwnerSidebar from './OwnerSidebar'

export default async function OwnerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify user is an owner
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'owner') {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Sidebar */}
            <OwnerSidebar profile={profile} user={user} />

            {/* Main content */}
            <main className="ml-64 min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/50 border-b border-white/10 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-white">Owner Dashboard</h1>
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
