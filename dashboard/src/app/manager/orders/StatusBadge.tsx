'use client'

type OrderStatus = 'created' | 'assigned' | 'processing' | 'ready' | 'completed'

interface StatusBadgeProps {
    status: OrderStatus
}

const statusConfig = {
    created: {
        label: 'Created',
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/50',
        icon: '📝',
    },
    assigned: {
        label: 'Assigned',
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/50',
        icon: '👤',
    },
    processing: {
        label: 'Processing',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/50',
        icon: '⚙️',
    },
    ready: {
        label: 'Ready',
        color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50',
        icon: '✅',
    },
    completed: {
        label: 'Completed',
        color: 'bg-green-500/10 text-green-400 border-green-500/50',
        icon: '🎉',
    },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.created

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${config.color}`}>
            <span>{config.icon}</span>
            {config.label}
        </span>
    )
}
