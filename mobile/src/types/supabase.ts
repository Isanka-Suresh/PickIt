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
                    created_at: string
                }
                Insert: {
                    id: string
                    role: 'owner' | 'manager' | 'customer'
                    full_name?: string | null
                    username?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    role?: 'owner' | 'manager' | 'customer'
                    full_name?: string | null
                    username?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            supermarkets: {
                Row: {
                    id: string
                    name: string
                    owner_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    owner_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    owner_id?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            branches: {
                Row: {
                    id: string
                    supermarket_id: string | null
                    name: string
                    location: string | null
                    manager_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    supermarket_id?: string | null
                    name: string
                    location?: string | null
                    manager_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    supermarket_id?: string | null
                    name?: string
                    location?: string | null
                    manager_id?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            products: {
                Row: {
                    id: string
                    branch_id: string | null
                    name: string
                    category: string | null
                    sub_category: string | null
                    brand: string | null
                    unit: string | null
                    tags: string[] | null
                    price: number
                    stock: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    branch_id?: string | null
                    name: string
                    category?: string | null
                    sub_category?: string | null
                    brand?: string | null
                    unit?: string | null
                    tags?: string[] | null
                    price: number
                    stock?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    branch_id?: string | null
                    name?: string
                    category?: string | null
                    sub_category?: string | null
                    brand?: string | null
                    unit?: string | null
                    tags?: string[] | null
                    price?: number
                    stock?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            product_recommendations: {
                Row: {
                    id: string
                    product_id: string | null
                    recommended_product_id: string | null
                    recommendation_type: 'combo' | 'personal' | 'substitute' | null
                    score: number | null
                    branch_id: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    product_id?: string | null
                    recommended_product_id?: string | null
                    recommendation_type?: 'combo' | 'personal' | 'substitute' | null
                    score?: number | null
                    branch_id?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string | null
                    recommended_product_id?: string | null
                    recommendation_type?: 'combo' | 'personal' | 'substitute' | null
                    score?: number | null
                    branch_id?: string | null
                    updated_at?: string
                }
                Relationships: []
            }
            orders: {
                Row: {
                    id: string
                    customer_id: string | null
                    supermarket_id: string | null
                    branch_id: string | null
                    status: 'received' | 'preparing' | 'done' | 'collected'
                    scheduled_time: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    customer_id?: string | null
                    supermarket_id?: string | null
                    branch_id?: string | null
                    status?: 'received' | 'preparing' | 'done' | 'collected'
                    scheduled_time?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    customer_id?: string | null
                    supermarket_id?: string | null
                    branch_id?: string | null
                    status?: 'received' | 'preparing' | 'done' | 'collected'
                    scheduled_time?: string | null
                    created_at?: string
                }
                Relationships: []
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
                Relationships: []
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
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
