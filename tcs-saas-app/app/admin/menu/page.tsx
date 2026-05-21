import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/utils/constants'
import AdminMenuList from './_components/AdminMenuList'

export default async function AdminMenuPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', SHOP_ID)
    .order('sort_order')
    .order('created_at')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-sans font-bold text-2xl text-brand-text">Menu</h1>
        <Link
          href="/admin/menu/new"
          className="h-10 px-4 bg-brand-accent text-brand-on-accent rounded-xl font-sans font-semibold text-sm flex items-center gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tambah Produk
        </Link>
      </div>

      <AdminMenuList products={products ?? []} />
    </div>
  )
}
