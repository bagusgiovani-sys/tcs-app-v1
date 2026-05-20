import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/utils/constants'
import ProductDetail from './_components/ProductDetail'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('shop_id', SHOP_ID)
    .single()

  if (!product) notFound()

  return <ProductDetail product={product} />
}
