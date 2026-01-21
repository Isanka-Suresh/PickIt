import { createAdminClient } from '@/utils/supabase/admin'
import SupermarketsClient from './SupermarketsClient'

export default async function SupermarketsPage() {
    // Use admin client to bypass RLS for owner operations
    const supabase = createAdminClient()

    const { data: supermarkets, error } = await supabase
        .from('supermarkets')
        .select(`
            id,
            name,
            created_at,
            branches(count)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching supermarkets:', error)
    }

    return <SupermarketsClient supermarkets={supermarkets || []} />
}
