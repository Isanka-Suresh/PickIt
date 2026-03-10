import { createClient } from '@/utils/supabase/server'
import EmployeesClient from './EmployeesClient'

export default async function EmployeesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get manager's branch
    const { data: branch } = await supabase
        .from('branches')
        .select('id, name')
        .eq('manager_id', user?.id)
        .single()

    // Fetch employees for the branch
    const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('branch_id', branch?.id || '')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Employees</h2>
                    <p className="text-gray-400">
                        {branch ? `Managing employees for ${branch.name}` : 'No branch assigned'}
                    </p>
                </div>
            </div>

            {/* Pass branchId so the modal can include it — eliminates a DB lookup per mutation */}
            <EmployeesClient initialEmployees={employees || []} branchId={branch?.id || ''} />
        </div>
    )
}
