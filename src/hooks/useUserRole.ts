import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'manager' | 'staff';

export interface RolePermissions {
  canAccessSettings: boolean;
  canAccessReports: boolean;
  canAccessUserManagement: boolean;
  canManageProducts: boolean;
  canManageCustomers: boolean;
  canManageSuppliers: boolean;
  canManageCategories: boolean;
  canAccessPOS: boolean;
  canAccessSales: boolean;
  canAccessReturns: boolean;
  canAccessDashboard: boolean;
  canBackupRestore: boolean;
  canResetData: boolean;
}

// Fallback permissions if DB fetch fails
const fallbackPermissions: Record<AppRole, RolePermissions> = {
  admin: {
    canAccessSettings: true, canAccessReports: true, canAccessUserManagement: true,
    canManageProducts: true, canManageCustomers: true, canManageSuppliers: true,
    canManageCategories: true, canAccessPOS: true, canAccessSales: true,
    canAccessReturns: true, canAccessDashboard: true, canBackupRestore: true, canResetData: true,
  },
  manager: {
    canAccessSettings: false, canAccessReports: false, canAccessUserManagement: false,
    canManageProducts: true, canManageCustomers: false, canManageSuppliers: false,
    canManageCategories: false, canAccessPOS: false, canAccessSales: true,
    canAccessReturns: false, canAccessDashboard: true, canBackupRestore: true, canResetData: false,
  },
  staff: {
    canAccessSettings: false, canAccessReports: false, canAccessUserManagement: false,
    canManageProducts: false, canManageCustomers: false, canManageSuppliers: false,
    canManageCategories: false, canAccessPOS: false, canAccessSales: true,
    canAccessReturns: false, canAccessDashboard: true, canBackupRestore: false, canResetData: false,
  },
};

function dbRowToPermissions(row: any): RolePermissions {
  return {
    canAccessDashboard: row.can_access_dashboard,
    canAccessPOS: row.can_access_pos,
    canAccessSales: row.can_access_sales,
    canAccessReports: row.can_access_reports,
    canAccessSettings: row.can_access_settings,
    canManageProducts: row.can_manage_products,
    canManageCustomers: row.can_manage_customers,
    canManageSuppliers: row.can_manage_suppliers,
    canManageCategories: row.can_manage_categories,
    canAccessReturns: row.can_access_returns,
    canAccessUserManagement: row.can_access_user_management,
    canBackupRestore: row.can_backup_restore,
    canResetData: row.can_reset_data,
  };
}

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions>(fallbackPermissions.staff);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching role:', error);
        }

        const userRole = (data?.role as AppRole) || 'staff';
        setRole(userRole);
        setIsAdmin(userRole === 'admin');
        setIsManager(userRole === 'manager' || userRole === 'admin');

        // Fetch permissions from DB
        const { data: permData, error: permError } = await supabase
          .from('role_permissions')
          .select('*')
          .eq('role', userRole)
          .maybeSingle();

        if (permError || !permData) {
          // Admin always gets full access regardless
          if (userRole === 'admin') {
            setPermissions(fallbackPermissions.admin);
          } else {
            setPermissions(fallbackPermissions[userRole] || fallbackPermissions.staff);
          }
        } else {
          // Admin always gets full access
          if (userRole === 'admin') {
            setPermissions(fallbackPermissions.admin);
          } else {
            setPermissions(dbRowToPermissions(permData));
          }
        }
      } catch (error) {
        console.error('Error in useUserRole:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { role, isAdmin, isManager, loading, userId, permissions };
}
