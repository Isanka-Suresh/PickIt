export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    }

    return (
        <div className="flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} border-2 border-gray-600 border-t-cyan-500 rounded-full animate-spin`}
            />
        </div>
    )
}

export function LoadingPage({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="text-center">
                <div className="mb-4">
                    <LoadingSpinner size="lg" />
                </div>
                <p className="text-gray-400">{message}</p>
            </div>
        </div>
    )
}

export function LoadingCard() {
    return (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="animate-pulse space-y-4">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
            </div>
        </div>
    )
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="animate-pulse space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="h-12 bg-white/10 rounded"></div>
                ))}
            </div>
        </div>
    )
}
