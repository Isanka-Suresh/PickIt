'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function createManager(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify the current user is an owner
    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentProfile?.role !== 'owner') {
        return { error: 'Only owners can create managers' }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const full_name = formData.get('full_name') as string
    const branch_id = formData.get('branch_id') as string

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' }
    }

    // Use admin client to create auth user
    const adminClient = createAdminClient()

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    })

    if (authError) {
        return { error: authError.message }
    }

    // Create profile for the new manager
    const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
            id: authData.user.id,
            role: 'manager',
            full_name: full_name?.trim() || null
        })

    if (profileError) {
        // Rollback: delete the auth user if profile creation fails
        await adminClient.auth.admin.deleteUser(authData.user.id)
        return { error: profileError.message }
    }

    // If branch_id provided, assign manager to branch
    if (branch_id) {
        const { error: branchError } = await supabase
            .from('branches')
            .update({ manager_id: authData.user.id })
            .eq('id', branch_id)

        if (branchError) {
            console.error('Error assigning manager to branch:', branchError)
            // Don't fail the whole operation, just log it
        }
    }

    revalidatePath('/owner/managers')
    revalidatePath('/owner/branches')
    return { success: true }
}

export async function updateManager(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const full_name = formData.get('full_name') as string
    const branch_id = formData.get('branch_id') as string

    // Use admin client to update profile
    const adminClient = createAdminClient()

    const { error: profileError } = await adminClient
        .from('profiles')
        .update({
            full_name: full_name?.trim() || null
        })
        .eq('id', id)

    if (profileError) {
        return { error: profileError.message }
    }

    // Update branch assignment
    // First, remove manager from any currently assigned branches
    await supabase
        .from('branches')
        .update({ manager_id: null })
        .eq('manager_id', id)

    // Then assign to new branch if provided
    if (branch_id) {
        const { error: branchError } = await supabase
            .from('branches')
            .update({ manager_id: id })
            .eq('id', branch_id)

        if (branchError) {
            return { error: branchError.message }
        }
    }

    revalidatePath('/owner/managers')
    revalidatePath('/owner/branches')
    return { success: true }
}

export async function deleteManager(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify the current user is an owner
    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentProfile?.role !== 'owner') {
        return { error: 'Only owners can delete managers' }
    }

    // Use admin client to delete user
    const adminClient = createAdminClient()

    // Remove manager from branches first
    await adminClient
        .from('branches')
        .update({ manager_id: null })
        .eq('manager_id', id)

    // Delete profile
    const { error: profileError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', id)

    if (profileError) {
        return { error: profileError.message }
    }

    // Delete auth user
    const { error: authError } = await adminClient.auth.admin.deleteUser(id)

    if (authError) {
        return { error: authError.message }
    }

    revalidatePath('/owner/managers')
    revalidatePath('/owner/branches')
    return { success: true }
}
