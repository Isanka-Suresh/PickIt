'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EmployeeModal from './EmployeeModal'
import EmployeeCard from './EmployeeCard'

interface Employee {
    id: string
    employee_code: string
    full_name: string
    is_active: boolean
}

interface EmployeesClientProps {
    initialEmployees: Employee[]
    branchId: string
}

export default function EmployeesClient({ initialEmployees, branchId }: EmployeesClientProps) {
    const router = useRouter()
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

    const filteredEmployees = employees.filter(employee => {
        const matchesSearch =
            employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.employee_code.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && employee.is_active) ||
            (statusFilter === 'inactive' && !employee.is_active)

        return matchesSearch && matchesStatus
    })

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingEmployee(null)
    }

    const handleSuccess = () => {
        // Use Next.js router refresh to get fresh data from server
        router.refresh()
        setIsModalOpen(false)
        setEditingEmployee(null)
    }


    const activeCount = employees.filter(e => e.is_active).length
    const inactiveCount = employees.filter(e => !e.is_active).length

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                    <p className="text-sm text-gray-400 mb-2">Total Employees</p>
                    <p className="text-3xl font-bold text-white">{employees.length}</p>
                </div>
                <div className="backdrop-blur-xl bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
                    <p className="text-sm text-green-400 mb-2">Active</p>
                    <p className="text-3xl font-bold text-white">{activeCount}</p>
                </div>
                <div className="backdrop-blur-xl bg-gray-500/10 border border-gray-500/20 rounded-2xl p-6">
                    <p className="text-sm text-gray-400 mb-2">Inactive</p>
                    <p className="text-3xl font-bold text-white">{inactiveCount}</p>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 pl-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            />
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    >
                        <option value="all" className="bg-slate-900">All Status</option>
                        <option value="active" className="bg-slate-900">Active Only</option>
                        <option value="inactive" className="bg-slate-900">Inactive Only</option>
                    </select>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Employees Grid */}
            {filteredEmployees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map(employee => (
                        <EmployeeCard
                            key={employee.id}
                            employee={employee}
                            onEdit={handleEdit}
                            onDeleted={handleSuccess}
                            onStatusChanged={handleSuccess}
                        />
                    ))}
                </div>
            ) : (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Employees Found</h3>
                    <p className="text-gray-400 mb-6">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Get started by adding your first employee'
                        }
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 inline-flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Your First Employee
                        </button>
                    )}
                </div>
            )}

            {/* Employee Modal */}
            <EmployeeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                employee={editingEmployee}
                onSuccess={handleSuccess}
                branchId={branchId}
            />
        </>
    )
}
