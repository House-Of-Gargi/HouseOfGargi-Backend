-- ==============================================================================
-- Migration: 0002_seed_initial_data.sql
-- Description: Seeds initial luxury products catalog and initial orders
-- Target: Supabase / PostgreSQL (public schema)
-- ==============================================================================

-- 1. Insert Curated Products
INSERT INTO public.products (name, category, price_in_rupees, stock, image_url) VALUES
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
  ('Phulkari Silk Dupatta', 'accessories', 3600, 10, '/images/category-accessories.png')
ON CONFLICT DO NOTHING;

-- 2. Insert Sample Orders
INSERT INTO public.orders (order_number, customer_name, customer_phone, total_rupees, status, created_at) VALUES
  ('#HG-1042', 'Priya Sharma', '9876543210', 45000, 'Processing', '2026-10-12 10:00:00+00'),
  ('#HG-1041', 'Anjali Desai', '9876543211', 22500, 'Shipped', '2026-10-10 14:30:00+00'),
  ('#HG-B009', 'Simran Kaur', '9876543212', 85000, 'Bespoke Review', '2026-10-08 09:15:00+00'),
  ('#HG-1040', 'Neha Gupta', '9876543213', 18000, 'Delivered', '2026-10-05 16:45:00+00')
ON CONFLICT (order_number) DO NOTHING;
