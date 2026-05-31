import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/utils/constants'
import OrderStatusBadge from '@/components/customer/OrderStatusBadge'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

interface OrderRow {
  id: string
  status: OrderStatus
  total: number
  type: string
  created_at: string
  payment_status: string
}

export default async function OrderHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/order/history')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, type, created_at, payment_status')
    .eq('shop_id', SHOP_ID)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="px-5 pt-14 pb-8 flex flex-col gap-4">
      <h1 className="font-sans font-bold text-xl text-brand-text">Riwayat Pesanan</h1>

      {(orders ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="font-sans text-brand-subtext text-center">Belum ada pesanan</p>
          <Link
            href="/"
            className="font-sans text-sm font-semibold text-brand-accent"
          >
            Lihat Menu
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(orders ?? [] as OrderRow[]).map((order) => (
            <Link key={order.id} href={`/order/${order.id}`} className="block">
              <div className="bg-brand-card border border-brand-border rounded-2xl px-4 py-4 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="font-mono text-xs text-brand-subtext">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="font-display font-semibold text-brand-text text-base">
                    Rp {order.total.toLocaleString('id-ID')}
                  </p>
                  <p className="font-sans text-xs text-brand-subtext">
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {' · '}
                    {order.type === 'dine_in' ? 'Di Meja' : 'Ambil Sendiri'}
                  </p>
                </div>
                <div className="shrink-0">
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
