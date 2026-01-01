import { createClient } from '@/utils/supabase/server'
import SupermarketsClient from './SupermarketsClient'

export default async function SupermarketsPage() {
    const supabase = await createClient()

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
