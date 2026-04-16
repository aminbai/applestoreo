
-- Create role_permissions table for customizable per-role permissions
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL UNIQUE,
  can_access_dashboard boolean NOT NULL DEFAULT true,
  can_access_pos boolean NOT NULL DEFAULT false,
  can_access_sales boolean NOT NULL DEFAULT false,
  can_access_reports boolean NOT NULL DEFAULT false,
  can_access_settings boolean NOT NULL DEFAULT false,
  can_manage_products boolean NOT NULL DEFAULT false,
  can_manage_customers boolean NOT NULL DEFAULT false,
  can_manage_suppliers boolean NOT NULL DEFAULT false,
  can_manage_categories boolean NOT NULL DEFAULT false,
  can_access_returns boolean NOT NULL DEFAULT false,
  can_access_user_management boolean NOT NULL DEFAULT false,
  can_backup_restore boolean NOT NULL DEFAULT false,
  can_reset_data boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (needed for permission checks)
CREATE POLICY "Authenticated users can read role_permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Only admins can modify
CREATE POLICY "Admins can update role_permissions"
  ON public.role_permissions FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert role_permissions"
  ON public.role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Insert default permissions
INSERT INTO public.role_permissions (role, can_access_dashboard, can_access_pos, can_access_sales, can_access_reports, can_access_settings, can_manage_products, can_manage_customers, can_manage_suppliers, can_manage_categories, can_access_returns, can_access_user_management, can_backup_restore, can_reset_data)
VALUES
  ('admin', true, true, true, true, true, true, true, true, true, true, true, true, true),
  ('manager', true, false, true, false, false, true, false, false, false, false, false, true, false),
  ('staff', true, false, true, false, false, false, false, false, false, false, false, false, false);

-- Trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
