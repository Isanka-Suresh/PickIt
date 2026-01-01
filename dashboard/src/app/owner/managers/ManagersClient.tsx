'use client'

import { useState } from 'react'
import { createManager, updateManager, deleteManager } from './actions'

interface Branch {
    id: string
    name: string
    supermarkets: { name: string }[] | null
}

interface Manager {
    id: string
    full_name: string | null
    username: string | null
    created_at: string
    auth_user?: {
        email: string
    }
    assigned_branch?: {
        id: string
        name: string
    } | null
}

interface ManagersClientProps {
    managers: Manager[]
    branches: Branch[]
}

export default function ManagersClient({ managers, branches }: ManagersClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingManager, setEditingManager] = useState<Manager | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCreate = async (formData: FormData) => {
        setIsLoading(true)
        setError(null)
        const result = await createManager(formData)
        setIsLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setIsAddModalOpen(false)
        }
    }

    const handleUpdate = async (formData: FormData) => {
        if (!editingManager) return
        setIsLoading(true)
        setError(null)
        const result = await updateManager(editingManager.id, formData)
        setIsLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setEditingManager(null)
        }
    }

    const handleDelete = async () => {
        if (!deletingId) return
        setIsLoading(true)
        setError(null)
        const result = await deleteManager(deletingId)
        setIsLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setDeletingId(null)
        }
    }

    // Find unassigned branches for the dropdown
    const unassignedBranches = branches.filter(
        b => !managers.some(m => m.assigned_branch?.id === b.id)
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Managers</h2>
                    <p className="text-gray-400 mt-1">Create and manage manager accounts</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-cyan-500/25"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Manager
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                    {error}
                </div>
            )}

            {/* Managers List */}
            {managers.length === 0 ? (
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No managers yet</h3>
                    <p className="text-gray-400 mb-6">Create manager accounts to help run your branches</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                    >
                        Add Your First Manager
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {managers.map((manager) => (
                        <div
                            key={manager.id}
                            className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                                    {manager.full_name?.charAt(0).toUpperCase() || manager.auth_user?.email?.charAt(0).toUpperCase() || 'M'}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingManager(manager)}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setDeletingId(manager.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                                {manager.full_name || 'No Name Set'}
                            </h3>
                            <p className="text-sm text-gray-400 mb-3">{manager.auth_user?.email || 'No email'}</p>
                            {manager.assigned_branch ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    {manager.assigned_branch.name}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-500/10 text-gray-500 rounded-full text-sm">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Unassigned
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className="text-xl font-semibold text-white mb-4">Add Manager</h3>
                        <form action={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        placeholder="Enter manager's name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        placeholder="manager@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        minLength={6}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        placeholder="Minimum 6 characters"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Assign to Branch
                                    </label>
                                    <select
                                        name="branch_id"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    >
                                        <option value="" className="bg-slate-800">No branch (assign later)</option>
                                        {unassignedBranches.map((branch) => (
                                            <option key={branch.id} value={branch.id} className="bg-slate-800">
                                                {branch.name} ({branch.supermarkets?.[0]?.name})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false)
                                        setError(null)
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating...' : 'Create Manager'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingManager && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className="text-xl font-semibold text-white mb-4">Edit Manager</h3>
                        <form action={handleUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        disabled
                                        value={editingManager.auth_user?.email || ''}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        defaultValue={editingManager.full_name || ''}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        placeholder="Enter manager's name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Assign to Branch
                                    </label>
                                    <select
                                        name="branch_id"
                                        defaultValue={editingManager.assigned_branch?.id || ''}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    >
                                        <option value="" className="bg-slate-800">No branch assigned</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id} className="bg-slate-800">
                                                {branch.name} ({branch.supermarkets?.[0]?.name})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingManager(null)
                                        setError(null)
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
                        <div className="w-12 h-12 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white text-center mb-2">Delete Manager?</h3>
                        <p className="text-gray-400 text-center mb-6">
                            This will permanently delete the manager account and remove their access. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setDeletingId(null)
                                    setError(null)
                                }}
                                className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
