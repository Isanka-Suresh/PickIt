'use client'

import { useState } from 'react'
import { deleteEmployee, toggleEmployeeStatus } from './actions'

interface Employee {
    id: string
    employee_code: string
    full_name: string
    is_active: boolean
}

interface EmployeeCardProps {
    employee: Employee
    onEdit: (employee: Employee) => void
    onDeleted: () => void
    onStatusChanged: () => void
}

export default function EmployeeCard({ employee, onEdit, onDeleted, onStatusChanged }: EmployeeCardProps) {
    const [deleting, setDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [toggling, setToggling] = useState(false)

    const handleDelete = async () => {
        setDeleting(true)
        const result = await deleteEmployee(employee.id)

        if (result.success) {
            onDeleted()
        } else {
            alert(result.error || 'Failed to delete employee')
        }
        setDeleting(false)
        setShowConfirm(false)
    }

    const handleToggleStatus = async () => {
        setToggling(true)
        const result = await toggleEmployeeStatus(employee.id, employee.is_active)

        if (result.success) {
            onStatusChanged()
        } else {
            alert(result.error || 'Failed to update status')
        }
        setToggling(false)
    }

    return (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{employee.full_name}</h3>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${employee.is_active
                                ? 'bg-green-500/10 text-green-400 border border-green-500/50'
                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/50'
                            }`}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400">Code: {employee.employee_code}</p>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleToggleStatus}
                    disabled={toggling}
                    className={`flex-1 px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium border ${employee.is_active
                            ? 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border-gray-500/20'
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20'
                        } disabled:opacity-50`}
                >
                    {toggling ? 'Updating...' : employee.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                    onClick={() => onEdit(employee)}
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
                        <h3 className="text-lg font-bold text-white mb-2">Delete Employee?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Are you sure you want to delete &quot;{employee.full_name}&quot;? This action cannot be undone.
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
