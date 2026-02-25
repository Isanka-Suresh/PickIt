'use client'

import { useEffect, useState, useRef } from 'react'
import { createEmployee, updateEmployee } from './actions'

interface Employee {
    id: string
    employee_code: string
    full_name: string
    is_active: boolean
}

interface EmployeeModalProps {
    isOpen: boolean
    onClose: () => void
    employee?: Employee | null
    onSuccess: () => void
    branchId: string
}

export default function EmployeeModal({ isOpen, onClose, employee, onSuccess, branchId }: EmployeeModalProps) {
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
            if (employee) {
                result = await updateEmployee(employee.id, formData)
            } else {
                result = await createEmployee(formData)
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
                        {employee ? 'Edit Employee' : 'Add New Employee'}
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
                    {/* Hidden field — avoids a DB round-trip in createEmployee */}
                    {!employee && <input type="hidden" name="branch_id" value={branchId} />}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="employee_code" className="block text-sm font-medium text-gray-300 mb-2">
                            Employee Code
                        </label>
                        <input
                            type="text"
                            id="employee_code"
                            name="employee_code"
                            defaultValue={employee?.employee_code || ''}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                            placeholder="e.g., EMP001"
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">Must be unique</p>
                    </div>

                    <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            defaultValue={employee?.full_name || ''}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                            placeholder="Enter employee name"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_active"
                                value="true"
                                defaultChecked={employee?.is_active ?? true}
                                className="w-5 h-5 rounded bg-white/5 border-white/10 text-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
                                disabled={loading}
                            />
                            <span className="text-sm font-medium text-gray-300">Active Employee</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-8">Inactive employees cannot be assigned to orders</p>
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
                            {loading ? 'Saving...' : employee ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
