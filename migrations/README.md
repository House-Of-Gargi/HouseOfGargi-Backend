# House of Gargi — Database Migrations Tracker

This directory maintains an incremental, numbered record of all SQL migrations and database schema updates executed in the **Supabase SQL Editor**.

---

## Migration Index

| File | Type | Description | Status in Production |
| :--- | :--- | :--- | :--- |
| [`0001_initial_schema.sql`](./0001_initial_schema.sql) | DDL | Creates `products` and `orders` tables with UUID PKs & RLS | **Active** |
| [`0002_seed_initial_data.sql`](./0002_seed_initial_data.sql) | DML | Seeds 18 curated catalog items and sample orders | **Active** |

---

## Schema Reference (Current Production)

### 1. `products` Table
```sql
CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  price_in_rupees int4 NOT NULL,
  stock int4 NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2. `orders` Table
```sql
CREATE TABLE public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_phone text,
  total_rupees int4 NOT NULL,
  status text NOT NULL DEFAULT 'Processing',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## How to Add New Migrations

When you need to alter tables, add indexes, or introduce new tables:
1. Create a new file following the numbered sequence:
   - `0003_add_order_items.sql`
   - `0004_add_payment_signatures.sql`
   - `0005_add_inventory_reservation.sql`
2. Run the SQL script in your **Supabase Dashboard → SQL Editor**.
3. Commit the migration file to Git so the team has a version-controlled record of all schema changes.
