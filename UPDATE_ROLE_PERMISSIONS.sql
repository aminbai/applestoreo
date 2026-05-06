-- Update role_permissions table to give all users full access
-- Run this in Supabase SQL Editor

-- Create role_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL UNIQUE CHECK (role IN ('admin', 'manager', 'staff')),
  can_access_dashboard BOOLEAN DEFAULT true,
  can_access_pos BOOLEAN DEFAULT true,
  can_access_sales BOOLEAN DEFAULT true,
  can_access_reports BOOLEAN DEFAULT true,
  can_access_settings BOOLEAN DEFAULT true,
  can_manage_products BOOLEAN DEFAULT true,
  can_manage_customers BOOLEAN DEFAULT true,
  can_manage_suppliers BOOLEAN DEFAULT true,
  can_manage_categories BOOLEAN DEFAULT true,
  can_access_returns BOOLEAN DEFAULT true,
  can_access_user_management BOOLEAN DEFAULT true,
  can_backup_restore BOOLEAN DEFAULT true,
  can_reset_data BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Delete existing permissions if any
DELETE FROM public.role_permissions;

-- Insert full permissions for all roles
INSERT INTO public.role_permissions (
  role,
  can_access_dashboard,
  can_access_pos,
  can_access_sales,
  can_access_reports,
  can_access_settings,
  can_manage_products,
  can_manage_customers,
  can_manage_suppliers,
  can_manage_categories,
  can_access_returns,
  can_access_user_management,
  can_backup_restore,
  can_reset_data
) VALUES
  ('admin', true, true, true, true, true, true, true, true, true, true, true, true, true),
  ('manager', true, true, true, true, true, true, true, true, true, true, true, true, true),
  ('staff', true, true, true, true, true, true, true, true, true, true, true, true, true);

-- Enable RLS on role_permissions table
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Anyone can read role permissions"
  ON public.role_permissions FOR SELECT
  USING (true);

-- Verify permissions created
SELECT role, 
  can_access_dashboard, 
  can_access_pos, 
  can_access_sales,
  can_manage_products,
  can_manage_customers,
  can_access_settings
FROM public.role_permissions
ORDER BY role;
