import { createClient } from '@/utils/supabase/server'
import ProductsClient from './ProductsClient'

export default async function ProductsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get manager's branch
    const { data: branch } = await supabase
        .from('branches')
        .select('id, name')
        .eq('manager_id', user?.id)
        .single()

    // Fetch products for the branch
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('branch_id', branch?.id || '')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Products</h2>
                    <p className="text-gray-400">
                        {branch ? `Managing products for ${branch.name}` : 'No branch assigned'}
                    </p>
                </div>
            </div>

            <ProductsClient initialProducts={products || []} />
        </div>
    )
}
