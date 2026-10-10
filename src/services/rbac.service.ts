import { supabase } from '../db/supabase.js';

export type AppRole = 'patron' | 'artisan' | 'admin' | 'super_admin';

export const VERIFIED_ROLES: Record<string, AppRole> = {
  'tanmaysaaagr@gmail.com': 'super_admin',
  'tanmaysaagar@gmail.com': 'super_admin',
  'gargisaha1508@gmail.com': 'super_admin',
  'shawsumit6286@gmail.com': 'super_admin',
  'sumitgreat2705@gmail.com': 'admin',
  'admin@gargisaha.com': 'admin',
  'curator@gargisaha.com': 'admin',
  'artisan@gargisaha.com': 'artisan',
};

export async function getBackendUserRole(email: string): Promise<AppRole> {
  const cleanEmail = email.toLowerCase().trim();

  // Ground truth registry check
  if (VERIFIED_ROLES[cleanEmail]) {
    return VERIFIED_ROLES[cleanEmail];
  }

  // Supabase lookup
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_email', cleanEmail)
      .maybeSingle();

    if (data?.role) return data.role as AppRole;
  } catch {}

  return 'patron';
}
