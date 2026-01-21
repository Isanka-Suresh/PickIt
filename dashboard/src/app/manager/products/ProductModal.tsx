'use client'

import { useEffect, useState, useRef } from 'react'
import { createProduct, updateProduct, deleteProduct } from './actions'

interface Product {
    id: string
    name: string
    category: string
    price: number
    stock: number
}

interface ProductModalProps {
    isOpen: boolean
    onClose: () => void
    product?: Product | null
    onSuccess: () => void
}

export default function ProductModal({ isOpen, onClose, product, onSuccess }: ProductModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (!isOpen) {
            setError('')
            formRef.current?.reset()
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)

        try {
            let result
            if (product) {
                result = await updateProduct(product.id, formData)
            } else {
                result = await createProduct(formData)
            }

            if (result.error) {
                setError(result.error)
            } else {
                onSuccess()
                onClose()
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                            Product Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            defaultValue={product?.name || ''}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                            placeholder="Enter product name"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                            Category
                        </label>
                        <input
                            type="text"
                            id="category"
                            name="category"
                            defaultValue={product?.category || ''}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                            placeholder="e.g., Beverages, Snacks, Dairy"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                            Price ($)
                        </label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            defaultValue={product?.price || ''}
                            step="0.01"
                            min="0"
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                            placeholder="0.00"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-300 mb-2">
                            Stock Quantity
                        </label>
                        <input
                            type="number"
                            id="stock"
                            name="stock"
                            defaultValue={product?.stock || ''}
                            min="0"
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                            placeholder="0"
                            disabled={loading}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : product ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
