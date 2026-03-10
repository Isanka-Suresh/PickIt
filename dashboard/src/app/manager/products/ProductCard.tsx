'use client'

import { useState } from 'react'
import { deleteProduct } from './actions'

interface Product {
    id: string
    name: string
    category: string
    price: number
    stock: number
}

interface ProductCardProps {
    product: Product
    onEdit: (product: Product) => void
    onDeleted: () => void
}

export default function ProductCard({ product, onEdit, onDeleted }: ProductCardProps) {
    const [deleting, setDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const handleDelete = async () => {
        setDeleting(true)
        const result = await deleteProduct(product.id)

        if (result.success) {
            onDeleted()
        } else {
            alert(result.error || 'Failed to delete product')
        }
        setDeleting(false)
        setShowConfirm(false)
    }

    const getStockStatus = () => {
        if (product.stock === 0) {
            return { label: 'Out of Stock', color: 'text-red-400 bg-red-500/10 border-red-500/50' }
        } else if (product.stock < 10) {
            return { label: 'Low Stock', color: 'text-amber-400 bg-amber-500/10 border-amber-500/50' }
        }
        return { label: 'In Stock', color: 'text-green-400 bg-green-500/10 border-green-500/50' }
    }

    const stockStatus = getStockStatus()

    return (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-400">{product.category}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${stockStatus.color}`}>
                    {stockStatus.label}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-xs text-gray-500 mb-1">Price</p>
                    <p className="text-xl font-bold text-white">${product.price.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">Stock</p>
                    <p className="text-xl font-bold text-white">{product.stock}</p>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onEdit(product)}
                    className="flex-1 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition-all duration-200 text-sm font-medium border border-cyan-500/20"
                >
                    Edit
                </button>
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all duration-200 text-sm font-medium border border-red-500/20 disabled:opacity-50"
                >
                    {deleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-2xl w-full max-w-sm mx-4 p-6">
                        <h3 className="text-lg font-bold text-white mb-2">Delete Product?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Are you sure you want to delete &quot;{product.name}&quot;? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
