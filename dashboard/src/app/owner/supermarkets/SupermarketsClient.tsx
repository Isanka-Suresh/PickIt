'use client'

import { useState } from 'react'
import { createSupermarket, updateSupermarket, deleteSupermarket } from './actions'

interface Supermarket {
    id: string
    name: string
    created_at: string
    branches: { count: number }[]
}

interface SupermarketsClientProps {
    supermarkets: Supermarket[]
}

export default function SupermarketsClient({ supermarkets }: SupermarketsClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingSupermarket, setEditingSupermarket] = useState<Supermarket | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCreate = async (formData: FormData) => {
        setIsLoading(true)
        setError(null)
        const result = await createSupermarket(formData)
        setIsLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setIsAddModalOpen(false)
        }
    }

    const handleUpdate = async (formData: FormData) => {
        if (!editingSupermarket) return
        setIsLoading(true)
        setError(null)
        const result = await updateSupermarket(editingSupermarket.id, formData)
        setIsLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setEditingSupermarket(null)
        }
    }

    const handleDelete = async () => {
        if (!deletingId) return
        setIsLoading(true)
        setError(null)
        const result = await deleteSupermarket(deletingId)
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
                    <h2 className="text-2xl font-bold text-white">Supermarkets</h2>
                    <p className="text-gray-400 mt-1">Manage your supermarket chains</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg shadow-amber-500/25"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Supermarket
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                    {error}
                </div>
            )}

            {/* Supermarkets Grid */}
            {supermarkets.length === 0 ? (
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No supermarkets yet</h3>
                    <p className="text-gray-400 mb-6">Get started by adding your first supermarket</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                    >
                        Add Your First Supermarket
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {supermarkets.map((supermarket) => (
                        <div
                            key={supermarket.id}
                            className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingSupermarket(supermarket)}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setDeletingId(supermarket.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{supermarket.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    {supermarket.branches?.[0]?.count || 0} branches
                                </span>
                                <span>
                                    {new Date(supermarket.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className="text-xl font-semibold text-white mb-4">Add Supermarket</h3>
                        <form action={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Supermarket Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                                    placeholder="Enter supermarket name"
                                />
                            </div>
                            <div className="flex gap-3">
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
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingSupermarket && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className="text-xl font-semibold text-white mb-4">Edit Supermarket</h3>
                        <form action={handleUpdate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Supermarket Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    defaultValue={editingSupermarket.name}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingSupermarket(null)
                                        setError(null)
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
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
                        <h3 className="text-xl font-semibold text-white text-center mb-2">Delete Supermarket?</h3>
                        <p className="text-gray-400 text-center mb-6">
                            This will permanently delete the supermarket and all associated branches. This action cannot be undone.
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
