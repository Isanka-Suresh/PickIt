'use client'

import { useState } from 'react'
import { createBranch, updateBranch, deleteBranch } from './actions'

interface Supermarket {
    id: string
    name: string
}

interface Manager {
    id: string
    full_name: string | null
}

interface Branch {
    id: string
    name: string
    location: string | null
    created_at: string
    supermarket_id: string
    manager_id: string | null
    supermarkets: { name: string }[] | null
    manager: { full_name: string | null }[] | null
}

interface BranchesClientProps {
    branches: Branch[]
    supermarkets: Supermarket[]
    managers: Manager[]
}

export default function BranchesClient({ branches, supermarkets, managers }: BranchesClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCreate = async (formData: FormData) => {
        setIsLoading(true)
        setError(null)
        const result = await createBranch(formData)
        setIsLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setIsAddModalOpen(false)
        }
    }

    const handleUpdate = async (formData: FormData) => {
        if (!editingBranch) return
        setIsLoading(true)
        setError(null)
        const result = await updateBranch(editingBranch.id, formData)
        setIsLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setEditingBranch(null)
        }
    }

    const handleDelete = async () => {
        if (!deletingId) return
        setIsLoading(true)
        setError(null)
        const result = await deleteBranch(deletingId)
        setIsLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Branches</h2>
                    <p className="text-gray-400 mt-1">Manage locations across your supermarkets</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={supermarkets.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Branch
                </button>
            </div>

            {/* Warning if no supermarkets */}
            {supermarkets.length === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-400 flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>You need to create a supermarket first before adding branches.</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                    {error}
                </div>
            )}

            {/* Branches Table */}
            {branches.length === 0 ? (
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No branches yet</h3>
                    <p className="text-gray-400 mb-6">Start by adding your first branch location</p>
                    {supermarkets.length > 0 && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                        >
                            Add Your First Branch
                        </button>
                    )}
                </div>
            ) : (
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Branch Name</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Location</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Supermarket</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Manager</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branches.map((branch) => (
                                <tr key={branch.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                            </div>
                                            <span className="font-medium text-white">{branch.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">{branch.location || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-sm">
                                            {branch.supermarkets?.[0]?.name || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {branch.manager?.[0]?.full_name || (
                                            <span className="text-gray-600 italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditingBranch(branch)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(branch.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className="text-xl font-semibold text-white mb-4">Add Branch</h3>
                        <form action={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Supermarket *
                                    </label>
                                    <select
                                        name="supermarket_id"
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                    >
                                        <option value="" className="bg-slate-800">Select a supermarket</option>
                                        {supermarkets.map((sm) => (
                                            <option key={sm.id} value={sm.id} className="bg-slate-800">
                                                {sm.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Branch Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                        placeholder="e.g., Downtown Branch"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                        placeholder="e.g., 123 Main Street"
                                    />
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
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingBranch && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className="text-xl font-semibold text-white mb-4">Edit Branch</h3>
                        <form action={handleUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Supermarket *
                                    </label>
                                    <select
                                        name="supermarket_id"
                                        required
                                        defaultValue={editingBranch.supermarket_id}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                    >
                                        {supermarkets.map((sm) => (
                                            <option key={sm.id} value={sm.id} className="bg-slate-800">
                                                {sm.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Branch Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        defaultValue={editingBranch.name}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        defaultValue={editingBranch.location || ''}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Assigned Manager
                                    </label>
                                    <select
                                        name="manager_id"
                                        defaultValue={editingBranch.manager_id || ''}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                    >
                                        <option value="" className="bg-slate-800">No manager assigned</option>
                                        {managers.map((manager) => (
                                            <option key={manager.id} value={manager.id} className="bg-slate-800">
                                                {manager.full_name || 'Unnamed Manager'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingBranch(null)
                                        setError(null)
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
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
                        <h3 className="text-xl font-semibold text-white text-center mb-2">Delete Branch?</h3>
                        <p className="text-gray-400 text-center mb-6">
                            This will permanently delete the branch and all associated data. This action cannot be undone.
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
