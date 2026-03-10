-- ============================================
-- PickIt Database - Complete Setup Script
-- ============================================
-- This script includes:
-- 1. Table creation
-- 2. RLS enablement
-- 3. Complete RLS policies
-- 4. Indexes
-- 5. Permissions
--
-- Run this in Supabase SQL Editor to set up the complete database
-- ============================================
-- ============================================
-- PART 1: DROP EXISTING TABLES (Fresh Start)
-- ============================================
DROP TABLE IF EXISTS order_assignments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS supermarkets CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
-- ============================================
-- PART 2: CREATE TABLES
-- ============================================
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
-- ============================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supermarkets ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_assignments ENABLE ROW LEVEL SECURITY;
-- ============================================
-- PART 4: GRANT PERMISSIONS TO ROLES
-- ============================================
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
-- ============================================
-- PART 5: RLS POLICIES - SERVICE ROLE
-- ============================================
-- Service role gets full access to all tables
CREATE POLICY "Service role full access" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON supermarkets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON branches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON employees FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON order_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ============================================
-- PART 6: RLS POLICIES - PROFILES
-- ============================================
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR
INSERT TO authenticated WITH CHECK (auth.uid() = id);
-- ============================================
-- PART 7: RLS POLICIES - SUPERMARKETS
-- ============================================
CREATE POLICY "Owners can manage supermarkets" ON supermarkets FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'owner'
    )
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'owner'
    )
);
-- ============================================
-- PART 8: RLS POLICIES - BRANCHES
-- ============================================
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
-- ============================================
-- PART 9: RLS POLICIES - EMPLOYEES
-- ============================================
CREATE POLICY "Managers can view employees" ON employees FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM branches b
            WHERE b.id = employees.branch_id
                AND b.manager_id = auth.uid()
        )
    );
CREATE POLICY "Managers can insert employees" ON employees FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM branches b
            WHERE b.id = employees.branch_id
                AND b.manager_id = auth.uid()
        )
    );
CREATE POLICY "Managers can update employees" ON employees FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM branches b
            WHERE b.id = employees.branch_id
                AND b.manager_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM branches b
            WHERE b.id = employees.branch_id
                AND b.manager_id = auth.uid()
        )
    );
CREATE POLICY "Managers can delete employees" ON employees FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM branches b
        WHERE b.id = employees.branch_id
            AND b.manager_id = auth.uid()
    )
);
-- ============================================
-- PART 10: RLS POLICIES - PRODUCTS
-- ============================================
CREATE POLICY "Managers can view products" ON products FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM branches b
            WHERE b.id = products.branch_id
                AND b.manager_id = auth.uid()
        )
    );
CREATE POLICY "Managers can insert products" ON products FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM branches b
            WHERE b.id = products.branch_id
                AND b.manager_id = auth.uid()
        )
    );
CREATE POLICY "Managers can update products" ON products FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM branches b
            WHERE b.id = products.branch_id
                AND b.manager_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM branches b
            WHERE b.id = products.branch_id
                AND b.manager_id = auth.uid()
        )
    );
CREATE POLICY "Managers can delete products" ON products FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM branches b
        WHERE b.id = products.branch_id
            AND b.manager_id = auth.uid()
    )
);
-- ============================================
-- PART 11: RLS POLICIES - ORDERS
-- ============================================
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
CREATE POLICY "Managers can update orders in their branch" ON orders FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM branches b
            WHERE b.id = orders.branch_id
                AND b.manager_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM branches b
            WHERE b.id = orders.branch_id
                AND b.manager_id = auth.uid()
        )
    );
-- ============================================
-- PART 12: RLS POLICIES - ORDER ASSIGNMENTS
-- ============================================
CREATE POLICY "Managers can manage order assignments" ON order_assignments FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM orders o
            JOIN branches b ON b.id = o.branch_id
        WHERE o.id = order_assignments.order_id
            AND b.manager_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM orders o
            JOIN branches b ON b.id = o.branch_id
        WHERE o.id = order_assignments.order_id
            AND b.manager_id = auth.uid()
    )
);
-- ============================================
-- PART 13: INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_supermarkets_owner ON supermarkets(owner_id);
CREATE INDEX idx_branches_supermarket ON branches(supermarket_id);
CREATE INDEX idx_branches_manager ON branches(manager_id);
CREATE INDEX idx_employees_branch ON employees(branch_id);
CREATE INDEX idx_products_branch ON products(branch_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_branch ON orders(branch_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_assignments_order ON order_assignments(order_id);
CREATE INDEX idx_order_assignments_employee ON order_assignments(employee_id);
-- ============================================
-- PART 14: DEBUG - CHECK MANAGER BRANCHES
-- ============================================
-- Uncomment and run this to check if managers are assigned to branches:
-- SELECT 
--     p.id as manager_user_id,
--     p.full_name as manager_name,
--     p.role,
--     b.id as branch_id,
--     b.name as branch_name
-- FROM profiles p
-- LEFT JOIN branches b ON b.manager_id = p.id
-- WHERE p.role = 'manager';
-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Create an owner user in Supabase Auth
-- 2. Insert profile with role='owner'
-- 3. Create a supermarket
-- 4. Create a branch
-- 5. Create a manager user in Supabase Auth
-- 6. Insert profile with role='manager'
-- 7. Assign manager to branch: UPDATE branches SET manager_id = 'MANAGER_USER_ID' WHERE id = 'BRANCH_ID'
-- ============================================