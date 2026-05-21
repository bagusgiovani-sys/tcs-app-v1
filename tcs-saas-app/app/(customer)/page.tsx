import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/utils/constants'
import HomeHeader from './_components/HomeHeader'
import PromoBanner from './_components/PromoBanner'
import CategoryProductList from './_components/CategoryProductList'
import PageSlide from './_components/PageSlide'

const CATEGORIES = [
  { value: 'all', label: 'Semua' },
  { value: 'coffee', label: 'Kopi' },
  { value: 'non-coffee', label: 'Non-Kopi' },
  { value: 'food', label: 'Makanan' },
  { value: 'merchandise', label: 'Merch' },
]

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', SHOP_ID)
    .eq('is_available', true)
    .order('sort_order')

  const { data: profile } = user
    ? await supabase.from('users').select('name').eq('id', user.id).single()
    : { data: null }

  const userName = profile?.name ?? (user?.user_metadata?.name as string | undefined) ?? null

  return (
    <PageSlide>
      <HomeHeader userName={userName} />
      <PromoBanner />
      <div className="px-5 mt-6 flex flex-col gap-4">
        <CategoryProductList products={products ?? []} categories={CATEGORIES} />
      </div>
    </PageSlide>
  )
}
