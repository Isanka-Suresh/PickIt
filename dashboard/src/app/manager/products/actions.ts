'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Get manager's branch
    const { data: branch } = await supabase
        .from('branches')
        .select('id')
        .eq('manager_id', user.id)
        .single()

    if (!branch) {
        return { error: 'No branch assigned to this manager' }
    }

    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const price = parseFloat(formData.get('price') as string)
    const stock = parseInt(formData.get('stock') as string)

    if (!name || !category || isNaN(price) || isNaN(stock)) {
        return { error: 'All fields are required and must be valid' }
    }

    if (price < 0) {
        return { error: 'Price must be a positive number' }
    }

    if (stock < 0) {
        return { error: 'Stock must be a positive number' }
    }

    const { data, error } = await supabase
        .from('products')
        .insert({
            branch_id: branch.id,
            name,
            category,
            price,
            stock,
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/manager/products')
    return { success: true, data }
}

export async function updateProduct(productId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const price = parseFloat(formData.get('price') as string)
    const stock = parseInt(formData.get('stock') as string)

    if (!name || !category || isNaN(price) || isNaN(stock)) {
        return { error: 'All fields are required and must be valid' }
    }

    if (price < 0) {
        return { error: 'Price must be a positive number' }
    }

    if (stock < 0) {
        return { error: 'Stock must be a positive number' }
    }

    const { data, error } = await supabase
        .from('products')
        .update({
            name,
            category,
            price,
            stock,
        })
        .eq('id', productId)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/manager/products')
    return { success: true, data }
}

export async function deleteProduct(productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/manager/products')
    return { success: true }
}
