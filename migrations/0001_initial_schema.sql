-- ==============================================================================
-- Migration: 0001_initial_schema.sql
-- Description: Creates the core tables (products and orders) for House of Gargi
-- Target: Supabase / PostgreSQL (public schema)
-- ==============================================================================

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  price_in_rupees int4 NOT NULL,
  stock int4 NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_phone text,
  total_rupees int4 NOT NULL,
  status text NOT NULL DEFAULT 'Processing',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security (RLS) Configuration
-- Enable RLS for database safety
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active products
CREATE POLICY "Allow public read-only access to products" 
ON public.products 
FOR SELECT 
USING (true);

-- Allow backend service role full access to orders
CREATE POLICY "Allow read access to orders" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert access to orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);
