'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function createBranch(formData: FormData) {
    // Use regular client for authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const name = formData.get('name') as string
    const location = formData.get('location') as string
    const supermarket_id = formData.get('supermarket_id') as string

    if (!name || name.trim() === '') {
        return { error: 'Branch name is required' }
    }

    if (!supermarket_id) {
        return { error: 'Please select a supermarket' }
    }

    // Use admin client for database operations to bypass RLS
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('branches')
        .insert({
            name: name.trim(),
            location: location?.trim() || null,
            supermarket_id
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/owner/branches')
    return { success: true }
}

export async function updateBranch(id: string, formData: FormData) {
    // Use regular client for authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const name = formData.get('name') as string
    const location = formData.get('location') as string
    const supermarket_id = formData.get('supermarket_id') as string
    const manager_id = formData.get('manager_id') as string

    if (!name || name.trim() === '') {
        return { error: 'Branch name is required' }
    }

    // Use admin client for database operations to bypass RLS
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('branches')
        .update({
            name: name.trim(),
            location: location?.trim() || null,
            supermarket_id,
            manager_id: manager_id || null
        })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/owner/branches')
    return { success: true }
}

export async function deleteBranch(id: string) {
    // Use regular client for authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Use admin client for database operations to bypass RLS
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('branches')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/owner/branches')
    return { success: true }
}
