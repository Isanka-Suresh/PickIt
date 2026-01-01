'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createSupermarket(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const name = formData.get('name') as string

    if (!name || name.trim() === '') {
        return { error: 'Supermarket name is required' }
    }

    const { error } = await supabase
        .from('supermarkets')
        .insert({
            name: name.trim(),
            owner_id: user.id
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/owner/supermarkets')
    return { success: true }
}

export async function updateSupermarket(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const name = formData.get('name') as string

    if (!name || name.trim() === '') {
        return { error: 'Supermarket name is required' }
    }

    const { error } = await supabase
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('supermarkets')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/owner/supermarkets')
    return { success: true }
}
