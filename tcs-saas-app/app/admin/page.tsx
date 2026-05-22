import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/utils/constants'
import StatCard from '@/components/admin/StatCard'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)

  const [{ count: todayOrders }, { data: revenueData }, { count: pendingCount }] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .eq('shop_id', SHOP_ID)
      .gte('created_at', today),
    supabase.rpc('sum_completed_revenue', { p_shop_id: SHOP_ID, p_date: today }),
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .eq('shop_id', SHOP_ID)
      .eq('status', 'pending'),
  ])

  const totalRevenue = Number(revenueData ?? 0)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-sans font-bold text-2xl text-brand-text">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pesanan Hari Ini" value={todayOrders ?? 0} />
        <StatCard label="Pendapatan Hari Ini" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} />
        <StatCard label="Menunggu Konfirmasi" value={pendingCount ?? 0} sub="perlu direspons" />
      </div>
    </div>
  )
}
