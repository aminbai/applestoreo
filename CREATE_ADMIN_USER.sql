-- Create Admin User via Supabase SQL
-- Run this in Supabase SQL Editor after creating the user via Auth

-- Step 1: First create the user in Supabase Auth (Settings → Authentication)
-- Then insert into users table:

INSERT INTO public.users (
  email,
  full_name,
  role
) VALUES (
  'admin@applestore.com',
  'Admin User',
  'admin'
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  updated_at = now();

-- Verify admin user created
SELECT id, email, role, created_at FROM public.users WHERE email = 'admin@applestore.com';
