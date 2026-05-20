import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/utils/constants'
import POSClient from './_components/POSClient'

export default async function POSPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', SHOP_ID)
    .eq('is_available', true)
    .order('sort_order')

  return <POSClient products={products ?? []} />
}
