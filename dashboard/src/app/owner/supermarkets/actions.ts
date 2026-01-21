'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function createSupermarket(formData: FormData) {
    console.log('=== CREATE SUPERMARKET ACTION START ===')

    // Use regular client for authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('User authenticated:', user?.id, user?.email)

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const name = formData.get('name') as string

    if (!name || name.trim() === '') {
        return { error: 'Supermarket name is required' }
    }

    // Use admin client for database operations to bypass RLS
    const adminClient = createAdminClient()

    console.log('Admin client created, SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('Attempting to insert supermarket:', name.trim(), 'for owner:', user.id)

    const { data, error } = await adminClient
        .from('supermarkets')
        .insert({
            name: name.trim(),
            owner_id: user.id
        })
        .select()

    console.log('Insert result:', { data, error })

    if (error) {
        console.error('Insert error:', error)
        return { error: error.message }
    }

    revalidatePath('/owner/supermarkets')
    console.log('=== CREATE SUPERMARKET ACTION SUCCESS ===')
    return { success: true }
}

export async function updateSupermarket(id: string, formData: FormData) {
    // Use regular client for authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const name = formData.get('name') as string

    if (!name || name.trim() === '') {
        return { error: 'Supermarket name is required' }
    }

    // Use admin client for database operations to bypass RLS
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('supermarkets')
        .update({ name: name.trim() })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/owner/supermarkets')
    return { success: true }
}

export async function deleteSupermarket(id: string) {
    // Use regular client for authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Use admin client for database operations to bypass RLS
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('supermarkets')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/owner/supermarkets')
    return { success: true }
}
