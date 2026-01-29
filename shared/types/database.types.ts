export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    role: 'owner' | 'manager' | 'customer'
                    full_name: string | null
                    username: string | null
                    created_at: string | null
                }
                Insert: {
                    id: string
                    role: 'owner' | 'manager' | 'customer'
                    full_name?: string | null
                    username?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    role?: 'owner' | 'manager' | 'customer'
                    full_name?: string | null
                    username?: string | null
                    created_at?: string | null
                }
            }
            supermarkets: {
                Row: {
                    id: string
                    name: string
                    owner_id: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    owner_id?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    owner_id?: string | null
                    created_at?: string | null
                }
            }
            branches: {
                Row: {
                    id: string
                    supermarket_id: string | null
                    name: string
                    location: string | null
                    manager_id: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    supermarket_id?: string | null
                    name: string
                    location?: string | null
                    manager_id?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    supermarket_id?: string | null
                    name?: string
                    location?: string | null
                    manager_id?: string | null
                    created_at?: string | null
                }
            }
            employees: {
                Row: {
                    id: string
                    branch_id: string | null
                    employee_code: string
                    full_name: string | null
                    is_active: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    branch_id?: string | null
                    employee_code: string
                    full_name?: string | null
                    is_active?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    branch_id?: string | null
                    employee_code?: string
                    full_name?: string | null
                    is_active?: boolean | null
                    created_at?: string | null
                }
            }
            products: {
                Row: {
                    id: string
                    branch_id: string | null
                    name: string
                    category: string | null
                    price: number
                    stock: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    branch_id?: string | null
                    name: string
                    category?: string | null
                    price: number
                    stock?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    branch_id?: string | null
                    name?: string
                    category?: string | null
                    price?: number
                    stock?: number | null
                    created_at?: string | null
                }
            }
            orders: {
                Row: {
                    id: string
                    customer_id: string | null
                    supermarket_id: string | null
                    branch_id: string | null
                    status: 'created' | 'assigned' | 'processing' | 'ready' | 'completed' | null
                    scheduled_time: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    customer_id?: string | null
                    supermarket_id?: string | null
                    branch_id?: string | null
                    status?: 'created' | 'assigned' | 'processing' | 'ready' | 'completed' | null
                    scheduled_time?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    customer_id?: string | null
                    supermarket_id?: string | null
                    branch_id?: string | null
                    status?: 'created' | 'assigned' | 'processing' | 'ready' | 'completed' | null
                    scheduled_time?: string | null
                    created_at?: string | null
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string | null
                    product_id: string | null
                    quantity: number
                }
                Insert: {
                    id?: string
                    order_id?: string | null
                    product_id?: string | null
                    quantity: number
                }
                Update: {
                    id?: string
                    order_id?: string | null
                    product_id?: string | null
                    quantity?: number
                }
            }
            order_assignments: {
                Row: {
                    id: string
                    order_id: string | null
                    employee_id: string | null
                    assigned_at: string | null
                }
                Insert: {
                    id?: string
                    order_id?: string | null
                    employee_id?: string | null
                    assigned_at?: string | null
                }
                Update: {
                    id?: string
                    order_id?: string | null
                    employee_id?: string | null
                    assigned_at?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
