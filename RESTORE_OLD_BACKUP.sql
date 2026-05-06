-- Convert and restore old backup format (v1.0) to Supabase
-- Run this in Supabase SQL Editor for manual restore

-- Step 1: Delete existing data (maintain foreign key order)
DELETE FROM public.returns;
DELETE FROM public.purchase_items;
DELETE FROM public.sale_items;
DELETE FROM public.invoices;
DELETE FROM public.purchases;
DELETE FROM public.sales;
DELETE FROM public.products;
DELETE FROM public.customers;
DELETE FROM public.suppliers;
DELETE FROM public.categories;

-- Step 2: Insert Categories
INSERT INTO public.categories (id, name, description, created_at, updated_at)
VALUES 
  ('4bc89943-2786-42f5-9335-f710d1fb33cd', '10C', NULL, '2026-04-13T13:39:01.036753+00:00', '2026-04-13T13:48:40.431433+00:00'),
  ('5b77a3b7-63ea-422c-b45a-6b8a229784ae', '15 PRO MAX', NULL, '2026-04-13T12:33:08.66526+00:00', '2026-04-13T12:33:08.66526+00:00'),
  ('5c88a4c8-73fb-533d-c56b-7c9b340895bf', 'Other Categories', NULL, NOW(), NOW());

-- Step 3: Insert Suppliers
INSERT INTO public.suppliers (id, name, email, phone, address, notes, created_at, updated_at)
VALUES
  ('supplier-1', 'Default Supplier', NULL, NULL, NULL, NULL, NOW(), NOW());

-- Step 4: Insert Customers
INSERT INTO public.customers (id, name, email, phone, address, notes, image_url, created_at, updated_at, total_purchases, purchase_count)
VALUES
  ('customer-1', 'Default Customer', NULL, NULL, NULL, NULL, NULL, NOW(), NOW(), 0, 0);

-- Step 5: Insert Products (with clean fields)
INSERT INTO public.products (
  id, name, description, category_id, sku, barcode, 
  price, cost, stock_quantity, low_stock_threshold, unit, 
  image_url, created_at, updated_at, brand, condition, imei
)
VALUES
  (
    'b6f08f88-1214-49fc-9b51-587ec31dee68',
    '10C',
    NULL,
    '4bc89943-2786-42f5-9335-f710d1fb33cd',
    'SKU-MNX8NWVO-E2Y8X',
    '583829810698',
    0,
    3000,
    1,
    0,
    'pcs',
    NULL,
    '2026-04-13T13:39:01.036753+00:00',
    '2026-04-13T13:48:40.431433+00:00',
    '10C',
    'used',
    '862853069992815'
  ),
  (
    'c08e047a-aa20-4fe9-b42c-be4e186e7c15',
    '15 PRO MAX',
    NULL,
    '5b77a3b7-63ea-422c-b45a-6b8a229784ae',
    'SKU-MNX6B78O-WR6R5',
    '916228899674',
    0,
    87000,
    1,
    0,
    'pcs',
    NULL,
    '2026-04-13T12:33:08.66526+00:00',
    '2026-04-13T12:33:08.66526+00:00',
    '15',
    'new',
    NULL
  );

-- Verify data restored
SELECT COUNT(*) as total_categories FROM public.categories;
SELECT COUNT(*) as total_products FROM public.products;
SELECT COUNT(*) as total_customers FROM public.customers;
SELECT COUNT(*) as total_suppliers FROM public.suppliers;

-- Show product list
SELECT id, name, category_id, brand, price, cost, stock_quantity FROM public.products LIMIT 10;
