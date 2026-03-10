'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // branch_id is passed as a hidden form field from the modal (avoids an extra DB round-trip).
    // Fall back to a DB lookup for safety if the field is somehow missing.
    let branchId = formData.get('branch_id') as string | null

    if (!branchId) {
        const { data: branch } = await supabase
            .from('branches')
            .select('id')
            .eq('manager_id', user.id)
            .single()

        if (!branch) {
            return { error: 'No branch assigned to this manager' }
        }
        branchId = branch.id
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
            branch_id: branchId,
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
