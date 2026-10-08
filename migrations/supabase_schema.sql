-- Drop existing tables if they exist
drop table if exists orders;
drop table if exists products;

-- 1. Create Products Table
create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  price_in_rupees integer not null,
  stock integer not null default 0,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Orders Table
create table orders (
  id uuid default gen_random_uuid() primary key,
  order_number text not null unique,
  customer_name text not null,
  customer_phone text,
  total_rupees integer not null,
  status text not null default 'Processing',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Disable RLS for now so the app can fetch data without policies (since auth is bypassed)
-- Note: In a real production app, you should enable RLS and add policies!
alter table products disable row level security;
alter table orders disable row level security;

-- 4. Insert Dummy Products
insert into products (name, category, price_in_rupees, stock, image_url) values
  ('Banarasi Gold Weave Saree', 'sarees', 28500, 10, '/images/category-sarees.png'),
  ('Kanchipuram Temple Border', 'sarees', 34000, 10, '/images/category-sarees.png'),
  ('Chanderi Floral Jaal', 'sarees', 12800, 10, '/images/category-sarees.png'),
  ('Tussar Silk Block Print', 'sarees', 9500, 10, '/images/category-sarees.png'),
  ('Paithani Peacock Pallu', 'sarees', 42000, 10, '/images/category-sarees.png'),
  ('Royal Zardozi Bridal Lehenga', 'lehengas', 125000, 10, '/images/category-lehengas.png'),
  ('Gota Patti Festive Lehenga', 'lehengas', 68000, 10, '/images/category-lehengas.png'),
  ('Chikankari Ivory Anarkali', 'lehengas', 45000, 10, '/images/category-lehengas.png'),
  ('Mirror Work Chaniya Choli', 'lehengas', 38000, 10, '/images/category-lehengas.png'),
  ('Sanganeri Block Print Kurta Set', 'kurta-sets', 4800, 10, '/images/category-kurtas.png'),
  ('Chikankari White-on-White Kurta', 'kurta-sets', 6200, 10, '/images/category-kurtas.png'),
  ('Ajrakh Silk Kurta Set', 'kurta-sets', 8900, 10, '/images/category-kurtas.png'),
  ('Kalamkari Anarkali Kurta', 'kurta-sets', 5600, 10, '/images/category-kurtas.png'),
  ('Bandhani Silk Festival Kurta', 'kurta-sets', 7200, 10, '/images/category-kurtas.png'),
  ('Kundan Polki Choker Set', 'accessories', 18500, 10, '/images/category-accessories.png'),
  ('Meenakari Jhumka Earrings', 'accessories', 4200, 10, '/images/category-accessories.png'),
  ('Temple Jewellery Necklace Set', 'accessories', 12800, 10, '/images/category-accessories.png'),
  ('Phulkari Silk Dupatta', 'accessories', 3600, 10, '/images/category-accessories.png');

-- 5. Insert Dummy Orders
insert into orders (order_number, customer_name, total_rupees, status, created_at) values
  ('#HG-1042', 'Priya Sharma', 45000, 'Processing', '2026-10-12'),
  ('#HG-1041', 'Anjali Desai', 22500, 'Shipped', '2026-10-10'),
  ('#HG-B009', 'Simran Kaur', 85000, 'Bespoke Review', '2026-10-08'),
  ('#HG-1040', 'Neha Gupta', 18000, 'Delivered', '2026-10-05');
