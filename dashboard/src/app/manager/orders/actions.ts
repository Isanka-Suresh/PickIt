'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type OrderStatus = 'created' | 'assigned' | 'processing' | 'ready' | 'completed'

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/manager/orders')
    return { success: true, data }
}

export async function assignEmployeeToOrder(orderId: string, employeeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Check if employee is already assigned
    const { data: existing } = await supabase
        .from('order_assignments')
        .select('id')
        .eq('order_id', orderId)
        .eq('employee_id', employeeId)
        .single()

    if (existing) {
        return { error: 'Employee is already assigned to this order' }
    }

    const { data, error } = await supabase
        .from('order_assignments')
        .insert({
            order_id: orderId,
            employee_id: employeeId,
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    // Update order status to 'assigned' if it's still 'created'
    await supabase
        .from('orders')
        .update({ status: 'assigned' })
        .eq('id', orderId)
        .eq('status', 'created')

    revalidatePath('/manager/orders')
    return { success: true, data }
}

export async function unassignEmployeeFromOrder(orderId: string, employeeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('order_assignments')
        .delete()
        .eq('order_id', orderId)
        .eq('employee_id', employeeId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/manager/orders')
    return { success: true }
}
