import type { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/utils/constants'

export interface OrderRequest {
  items: { product_id: string; quantity: number; notes?: string | null }[]
  type: 'pickup' | 'dine_in'
  paymentMethod: 'qris' | 'cash'
  tableNumber?: string | null
  notes?: string | null
}

/** A confirmed database rejection, rather than an uncertain network outcome. */
export class OrderRejectedError extends Error {}

export async function createTrustedOrder(
  supabase: ReturnType<typeof createClient>, request: OrderRequest, key: string,
): Promise<{ id: string; total: number }> {
  const { data, error } = await supabase.rpc('create_order', {
    p_shop_id: SHOP_ID,
    p_items: request.items.map((item) => ({ product_id: item.product_id, quantity: item.quantity, notes: item.notes ?? null })),
    p_type: request.type,
    p_payment_method: request.paymentMethod,
    p_idempotency_key: key,
    p_table_number: request.tableNumber ?? null,
    p_notes: request.notes ?? null,
  })
  if (error) {
    const validationMessages = ['Invalid shop or request key', 'Invalid order details', 'Items must be an array',
      'Invalid item count', 'Invalid order item', 'Invalid quantity', 'Product unavailable', 'Order total too large']
    if ((error.code === '22023' && validationMessages.includes(error.message)) || error.code === '42501') {
      throw new OrderRejectedError('Pesanan ditolak. Periksa produk, jumlah, meja, dan sesi lalu coba lagi.')
    }
    throw new Error('Gagal membuat pesanan. Silakan coba lagi atau hubungi kasir.')
  }
  if (!data || typeof data.id !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(data.id) ||
      typeof data.total !== 'number' || !Number.isFinite(data.total) || data.total < 0) {
    throw new Error('Gagal memverifikasi pesanan. Silakan hubungi kasir.')
  }
  return { id: data.id, total: data.total }
}
