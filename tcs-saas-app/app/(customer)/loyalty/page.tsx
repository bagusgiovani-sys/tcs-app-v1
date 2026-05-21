import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/utils/constants'
import LoyaltyCard from '@/components/customer/LoyaltyCard'
import Badge from '@/components/ui/Badge'

export default async function LoyaltyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/loyalty')

  const [{ data: profile }, { data: points }, { data: transactions }] = await Promise.all([
    supabase.from('users').select('name').eq('id', user.id).single(),
    supabase.from('loyalty_points').select('points').eq('customer_id', user.id).eq('shop_id', SHOP_ID).maybeSingle(),
    supabase.from('loyalty_transactions').select('*').eq('customer_id', user.id).eq('shop_id', SHOP_ID).order('created_at', { ascending: false }).limit(20),
  ])

  return (
    <div className="px-5 pt-14 flex flex-col gap-5">
      <h1 className="font-sans font-bold text-xl text-brand-text">Poin Loyalty</h1>
      <LoyaltyCard points={points?.points ?? 0} customerName={profile?.name ?? 'Kamu'} />
      <p className="font-sans text-brand-subtext text-xs text-center">
        Tukarkan 100 poin = diskon Rp 10.000
      </p>
      <h2 className="font-sans font-semibold text-brand-text">Riwayat</h2>
      <div className="flex flex-col gap-2">
        {(transactions ?? []).map((tx: any) => (
          <div key={tx.id} className="flex items-center justify-between bg-brand-card border border-brand-border rounded-xl px-4 py-3">
            <div>
              <p className="font-sans text-sm text-brand-text font-semibold">
                {tx.type === 'earn' ? 'Poin Diperoleh' : 'Poin Ditukar'}
              </p>
              <p className="font-sans text-xs text-brand-subtext">
                {new Date(tx.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
            <span className={`font-display font-semibold text-lg ${tx.points > 0 ? 'text-green-500' : 'text-red-400'}`}>
              {tx.points > 0 ? '+' : ''}{tx.points}
            </span>
          </div>
        ))}
        {(transactions ?? []).length === 0 && (
          <p className="text-center text-brand-subtext text-sm font-sans py-6">Belum ada transaksi</p>
        )}
      </div>
    </div>
  )
}
