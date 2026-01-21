'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function createManager(formData: FormData) {
    console.log('=== CREATE MANAGER ACTION START ===')

    // Use regular client for authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('User authenticated:', user?.id, user?.email)

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Use admin client for all database operations
    const adminClient = createAdminClient()

    console.log('Admin client created')

    // Verify the current user is an owner
    const { data: currentProfile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    console.log('Current user profile:', currentProfile)

    if (currentProfile?.role !== 'owner') {
        return { error: 'Only owners can create managers' }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const full_name = formData.get('full_name') as string
    const branch_id = formData.get('branch_id') as string

    console.log('Form data:', { email, full_name, branch_id, passwordLength: password?.length })

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' }
    }

    // Already using admin client from above

    // Create auth user
    console.log('Creating auth user...')
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    })

    console.log('Auth user created:', { userId: authData?.user?.id, error: authError })

    if (authError) {
        console.error('Auth error:', authError)
        return { error: authError.message }
    }

    // Create or update profile for the new manager
    // Note: Supabase may auto-create a profile via trigger, so we use upsert
    console.log('Creating/updating profile...')
    const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({
            id: authData.user.id,
            role: 'manager',
            full_name: full_name?.trim() || null
        }, {
            onConflict: 'id'
        })

    console.log('Profile created, error:', profileError)

    if (profileError) {
        console.error('Profile error:', profileError)
        // Rollback: delete the auth user if profile creation fails
        await adminClient.auth.admin.deleteUser(authData.user.id)
        return { error: profileError.message }
    }

    // If branch_id provided, assign manager to branch
    if (branch_id) {
        console.log('Assigning manager to branch:', branch_id)
        const { error: branchError } = await adminClient
            .from('branches')
            .update({ manager_id: authData.user.id })
            .eq('id', branch_id)

        console.log('Branch assignment result, error:', branchError)

        if (branchError) {
            console.error('Error assigning manager to branch:', branchError)
            // Don't fail the whole operation, just log it
        }
    }

    revalidatePath('/owner/managers')
    revalidatePath('/owner/branches')
    console.log('=== CREATE MANAGER ACTION SUCCESS ===')
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

    // Use admin client for all database operations
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
    await adminClient
        .from('branches')
        .update({ manager_id: null })
        .eq('manager_id', id)

    // Then assign to new branch if provided
    if (branch_id) {
        const { error: branchError } = await adminClient
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
    // Use regular client for authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Use admin client for all database operations
    const adminClient = createAdminClient()

    // Verify the current user is an owner
    const { data: currentProfile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentProfile?.role !== 'owner') {
        return { error: 'Only owners can delete managers' }
    }

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
