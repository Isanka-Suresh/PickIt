create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('owner', 'manager', 'customer')) not null,
  full_name text,
  username text unique,
  created_at timestamp default now()
);
create table supermarkets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references profiles(id),
  created_at timestamp default now()
);
create table branches (
  id uuid primary key default gen_random_uuid(),
  supermarket_id uuid references supermarkets(id) on delete cascade,
  name text not null,
  location text,
  manager_id uuid references profiles(id),
  created_at timestamp default now()
);
create table employees (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  employee_code text unique not null,
  full_name text,
  is_active boolean default true,
  created_at timestamp default now()
);
create table products (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  category text,
  price numeric not null,
  stock int default 0,
  created_at timestamp default now()
);
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id),
  supermarket_id uuid references supermarkets(id),
  branch_id uuid references branches(id),
  status text check (
    status in (
      'created',
      'assigned',
      'processing',
      'ready',
      'completed'
    )
  ) default 'created',
  scheduled_time timestamp,
  created_at timestamp default now()
);
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null
);
create table order_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  employee_id uuid references employees(id),
  assigned_at timestamp default now()
);

alter table profiles enable row level security;
alter table supermarkets enable row level security;
alter table branches enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table employees enable row level security;
alter table order_assignments enable row level security;

create policy "Users can view own profile"
on profiles
for select
using (auth.uid() = id);

create policy "Owner manages supermarkets"
on supermarkets
for all
using (
  exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'owner'
  )
);

create policy "Owner & manager access branches"
on branches
for select
using (
  exists (
    select 1 from profiles
    where id = auth.uid()
    and (
      role = 'owner'
      or id = manager_id
    )
  )
);

create policy "Manager manages products"
on products
for all
using (
  exists (
    select 1 from branches b
    join profiles p on p.id = auth.uid()
    where b.id = products.branch_id
    and (
      p.role = 'owner'
      or p.id = b.manager_id
    )
  )
);

create policy "Customer creates own orders"
on orders
for insert
with check (
  customer_id = auth.uid()
);

create policy "Customer sees own orders"
on orders
for select
using (customer_id = auth.uid());

create policy "Branch staff see branch orders"
on orders
for select
using (
  exists (
    select 1 from branches b
    join profiles p on p.id = auth.uid()
    where b.id = orders.branch_id
    and (
      p.role = 'owner'
      or p.id = b.manager_id
    )
  )
);

create policy "Manager assigns employees to orders"
on order_assignments
for insert
with check (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('owner', 'manager')
  )
);

create policy "Manager updates order status"
on orders
for update
using (
  exists (
    select 1
    from branches b
    join profiles p on p.id = auth.uid()
    where b.id = orders.branch_id
    and p.id = b.manager_id
  )
)
with check (
  exists (
    select 1
    from branches b
    join profiles p on p.id = auth.uid()
    where b.id = orders.branch_id
    and p.id = b.manager_id
  )
);

create policy "Manager creates employees"
on employees
for insert
with check (
  exists (
    select 1
    from branches b
    join profiles p on p.id = auth.uid()
    where b.id = employees.branch_id
    and p.id = b.manager_id
  )
);

create policy "Manager inserts products"
on products
for insert
with check (
  exists (
    select 1
    from branches b
    join profiles p on p.id = auth.uid()
    where b.id = products.branch_id
    and p.id = b.manager_id
  )
);
