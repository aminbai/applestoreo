-- Make existing user as Admin
-- Run this in Supabase SQL Editor

-- Update user role to admin
UPDATE public.users
SET role = 'admin', updated_at = now()
WHERE email = 'admin@applestore.com';

-- Verify admin user
SELECT id, email, full_name, role, created_at FROM public.users WHERE email = 'admin@applestore.com';

-- View all users
SELECT id, email, full_name, role FROM public.users;
