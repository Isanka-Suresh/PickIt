-- ============================================
-- PickIt Database Schema
-- ============================================
-- 1. DROP EXISTING TABLES
DROP TABLE IF EXISTS order_assignments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS supermarkets CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
-- 2. CREATE TABLES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'manager', 'customer')) NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE supermarkets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supermarket_id UUID REFERENCES supermarkets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    manager_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    employee_code TEXT UNIQUE NOT NULL,
    full_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES profiles(id),
    supermarket_id UUID REFERENCES supermarkets(id),
    branch_id UUID REFERENCES branches(id),
    status TEXT CHECK (
        status IN (
            'created',
            'assigned',
            'processing',
            'ready',
            'completed'
        )
    ) DEFAULT 'created',
    scheduled_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL
);
CREATE TABLE order_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    assigned_at TIMESTAMP DEFAULT NOW()
);
-- 3. GRANT PERMISSIONS (CRITICAL - prevents permission denied errors)
GRANT ALL ON profiles TO service_role,
    authenticated,
    anon;
GRANT ALL ON supermarkets TO service_role,
    authenticated,
    anon;
GRANT ALL ON branches TO service_role,
    authenticated,
    anon;
GRANT ALL ON employees TO service_role,
    authenticated,
    anon;
GRANT ALL ON products TO service_role,
    authenticated,
    anon;
GRANT ALL ON orders TO service_role,
    authenticated,
    anon;
GRANT ALL ON order_items TO service_role,
    authenticated,
    anon;
GRANT ALL ON order_assignments TO service_role,
    authenticated,
    anon;
-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supermarkets ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_assignments ENABLE ROW LEVEL SECURITY;
-- 5. RLS POLICIES - PROFILES
CREATE POLICY "Service role full access" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR
INSERT TO authenticated WITH CHECK (auth.uid() = id);
-- 6. RLS POLICIES - SUPERMARKETS
CREATE POLICY "Service role full access" ON supermarkets FOR ALL TO service_role USING (true);
CREATE POLICY "Owners can manage supermarkets" ON supermarkets FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'owner'
    )
);
-- 7. RLS POLICIES - BRANCHES
CREATE POLICY "Service role full access" ON branches FOR ALL TO service_role USING (true);
CREATE POLICY "Owner and manager can view branches" ON branches FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND (
                    role = 'owner'
                    OR id = branches.manager_id
                )
        )
    );
-- 8. RLS POLICIES - PRODUCTS
CREATE POLICY "Service role full access" ON products FOR ALL TO service_role USING (true);
CREATE POLICY "Manager can manage products" ON products FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM branches b
            JOIN profiles p ON p.id = auth.uid()
        WHERE b.id = products.branch_id
            AND (
                p.role = 'owner'
                OR p.id = b.manager_id
            )
    )
);
-- 9. RLS POLICIES - ORDERS
CREATE POLICY "Service role full access" ON orders FOR ALL TO service_role USING (true);
CREATE POLICY "Customer can create own orders" ON orders FOR
INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Customer can view own orders" ON orders FOR
SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Branch staff can view branch orders" ON orders FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM branches b
                JOIN profiles p ON p.id = auth.uid()
            WHERE b.id = orders.branch_id
                AND (
                    p.role = 'owner'
                    OR p.id = b.manager_id
                )
        )
    );
-- 10. RLS POLICIES - OTHER TABLES
CREATE POLICY "Service role full access" ON order_items FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON employees FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON order_assignments FOR ALL TO service_role USING (true);
-- 11. INDEXES
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_supermarkets_owner ON supermarkets(owner_id);
CREATE INDEX idx_branches_supermarket ON branches(supermarket_id);
CREATE INDEX idx_branches_manager ON branches(manager_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_branch ON orders(branch_id);