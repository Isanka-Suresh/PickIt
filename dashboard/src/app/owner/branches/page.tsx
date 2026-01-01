import { createClient } from '@/utils/supabase/server'
import BranchesClient from './BranchesClient'

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

interface Supermarket {
    id: string
    name: string
}

interface Manager {
    id: string
    full_name: string | null
}

export default async function BranchesPage() {
    const supabase = await createClient()

    // Fetch branches with supermarket and manager info
    const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select(`
            id,
            name,
            location,
            created_at,
            supermarket_id,
            manager_id,
            supermarkets(name),
            manager:profiles!branches_manager_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

    if (branchesError) {
        console.error('Error fetching branches:', branchesError)
    }

    // Fetch supermarkets for dropdown
    const { data: supermarkets, error: supermarketsError } = await supabase
        .from('supermarkets')
        .select('id, name')
        .order('name')

    if (supermarketsError) {
        console.error('Error fetching supermarkets:', supermarketsError)
    }

    // Fetch managers for assignment dropdown
    const { data: managers, error: managersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'manager')
        .order('full_name')

    if (managersError) {
        console.error('Error fetching managers:', managersError)
    }

    return (
        <BranchesClient
            branches={(branches as Branch[]) || []}
            supermarkets={(supermarkets as Supermarket[]) || []}
            managers={(managers as Manager[]) || []}
        />
    )
}

