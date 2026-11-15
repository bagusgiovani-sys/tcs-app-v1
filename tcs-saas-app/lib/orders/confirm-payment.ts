import type { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/utils/constants'

/** Compare-and-set prevents duplicate UPDATEs and their downstream side effects. */
export async function confirmOrderPayment(client: ReturnType<typeof createClient>, orderId: string) {
  const { data, error } = await client.from('orders')
    .update({ payment_status: 'paid', status: 'confirmed' })
    .eq('id', orderId).eq('shop_id', SHOP_ID).eq('status', 'pending').eq('payment_status', 'pending')
    .select('id, status, payment_status').maybeSingle()
  if (error) throw new Error('Gagal konfirmasi pembayaran. Periksa sesi dan coba lagi.')
  if (data) return data
  // Another staff member or a previous lost response may already have confirmed it.
  // Read its current state instead of writing again or moving its status backwards.
  const { data: current, error: readError } = await client.from('orders')
    .select('id, status, payment_status').eq('id', orderId).eq('shop_id', SHOP_ID).maybeSingle()
  if (readError || !current || current.payment_status !== 'paid' || current.status === 'cancelled') {
    throw new Error('Pembayaran tidak dapat dikonfirmasi. Muat ulang dan periksa pesanan.')
  }
  return current
}
