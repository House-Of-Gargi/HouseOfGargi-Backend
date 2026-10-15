import { supabase } from '../db/supabase.js';

export type AppRole = 'patron' | 'artisan' | 'admin' | 'super_admin';

export async function getBackendUserRole(email: string): Promise<AppRole> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    // 1. Check user_roles table (super_admin, admin, artisan, patron)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_email', cleanEmail)
      .maybeSingle();

    if (!roleError && roleData?.role) {
      return roleData.role as AppRole;
    }

    // 2. Check artisan_profiles
    const { data: artisanData, error: artisanError } = await supabase
      .from('artisan_profiles')
      .select('id')
      .eq('user_email', cleanEmail)
      .maybeSingle();

    if (!artisanError && artisanData) {
      return 'artisan';
    }
  } catch (err) {
    console.warn('[RBAC Service] Supabase role resolution error:', err);
  }

  return 'patron';
}
