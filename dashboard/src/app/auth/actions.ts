'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    // Use admin client to fetch profile (bypasses RLS)
    const adminClient = createAdminClient()

    const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

    if (profileError || !profile) {
        await supabase.auth.signOut()
        return { error: 'User profile not found. Please contact support.' }
    }

    // Store role in user_metadata so middleware can read it from the JWT
    // without making an extra DB query on every request
    await adminClient.auth.admin.updateUserById(authData.user.id, {
        user_metadata: { role: profile.role }
    })

    revalidatePath('/', 'layout')

    // Redirect based on role
    if (profile.role === 'owner') {
        redirect('/owner')
    } else if (profile.role === 'manager') {
        redirect('/manager')
    } else if (profile.role === 'customer') {
        await supabase.auth.signOut()
        return { error: 'Customer accounts cannot access this dashboard.' }
    } else {
        await supabase.auth.signOut()
        return { error: 'Invalid user role.' }
    }
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}