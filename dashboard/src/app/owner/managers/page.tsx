import { createAdminClient } from '@/utils/supabase/admin'
import ManagersClient from './ManagersClient'

interface Branch {
    id: string
    name: string
    manager_id: string | null
    supermarkets: { name: string }[] | null
}

interface Profile {
    id: string
    full_name: string | null
    username: string | null
    created_at: string
}

export default async function ManagersPage() {
    const supabase = createAdminClient()

    // Fetch managers with their profile info
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, created_at')
        .eq('role', 'manager')
        .order('created_at', { ascending: false })

    if (profilesError) {
        console.error('Error fetching managers:', profilesError)
    }

    // Fetch auth users to get emails
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
        console.error('Error fetching auth users:', authError)
    }

    // Fetch branches with their assigned managers
    const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select(`
            id,
            name,
            manager_id,
            supermarkets(name)
        `)
        .order('name')

    if (branchesError) {
        console.error('Error fetching branches:', branchesError)
    }

    // Combine profile data with auth user email and branch assignment
    const managers = (profiles || []).map(profile => {
        const authUser = authUsers?.users?.find(u => u.id === profile.id)
        const assignedBranch = (branches || []).find(b => b.manager_id === profile.id)

        return {
            ...profile,
            auth_user: authUser ? { email: authUser.email || '' } : undefined,
            assigned_branch: assignedBranch ? {
                id: assignedBranch.id,
                name: assignedBranch.name
            } : null
        }
    })

    return (
        <ManagersClient
            managers={managers}
            branches={branches || []}
        />
    )
}
