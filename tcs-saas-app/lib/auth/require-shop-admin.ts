import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/utils/constants'

export async function requireShopAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || !SHOP_ID) throw new Error('Unauthorized')
  const { data: profile, error } = await supabase.from('users')
    .select('role, org_id').eq('id', user.id).single()
  if (error || profile?.role !== 'admin' || profile.org_id !== SHOP_ID) {
    throw new Error('Forbidden')
  }
  return supabase
}
