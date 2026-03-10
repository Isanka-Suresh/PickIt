'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEmployee(formData: FormData) {
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

    const employee_code = formData.get('employee_code') as string
    const full_name = formData.get('full_name') as string
    const is_active = formData.get('is_active') === 'true'

    if (!employee_code || !full_name) {
        return { error: 'Employee code and name are required' }
    }

    // Check for duplicate employee code
    const { data: existing } = await supabase
        .from('employees')
        .select('id')
        .eq('employee_code', employee_code)
        .single()

    if (existing) {
        return { error: 'Employee code already exists' }
    }

    const { data, error } = await supabase
        .from('employees')
        .insert({
            branch_id: branchId,
            employee_code,
            full_name,
            is_active,
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/manager/employees')
    return { success: true, data }
}

export async function updateEmployee(employeeId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const employee_code = formData.get('employee_code') as string
    const full_name = formData.get('full_name') as string
    const is_active = formData.get('is_active') === 'true'

    if (!employee_code || !full_name) {
        return { error: 'Employee code and name are required' }
    }

    // Check for duplicate employee code (excluding current employee)
    const { data: existing } = await supabase
        .from('employees')
        .select('id')
        .eq('employee_code', employee_code)
        .neq('id', employeeId)
        .single()

    if (existing) {
        return { error: 'Employee code already exists' }
    }

    const { data, error } = await supabase
        .from('employees')
        .update({
            employee_code,
            full_name,
            is_active,
        })
        .eq('id', employeeId)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/manager/employees')
    return { success: true, data }
}

export async function deleteEmployee(employeeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/manager/employees')
    return { success: true }
}

export async function toggleEmployeeStatus(employeeId: string, currentStatus: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
        .from('employees')
        .update({ is_active: !currentStatus })
        .eq('id', employeeId)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/manager/employees')
    return { success: true, data }
}
