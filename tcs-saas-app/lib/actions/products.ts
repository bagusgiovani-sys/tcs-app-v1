'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/utils/constants'

interface ProductData {
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
  imageUrl?: string | null
}

export async function createProduct(data: ProductData) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').insert({
    shop_id: SHOP_ID,
    name: data.name,
    description: data.description || null,
    price: data.price,
    category: data.category,
    is_available: data.isAvailable,
    image_url: data.imageUrl ?? null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/menu')
  redirect('/admin/menu')
}

export async function updateProduct(id: string, data: ProductData) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({
      name: data.name,
      description: data.description || null,
      price: data.price,
      category: data.category,
      is_available: data.isAvailable,
      ...(data.imageUrl !== undefined ? { image_url: data.imageUrl } : {}),
    })
    .eq('id', id)
    .eq('shop_id', SHOP_ID)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/menu')
  redirect('/admin/menu')
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('shop_id', SHOP_ID)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/menu')
  redirect('/admin/menu')
}

export async function toggleProductAvailability(id: string, isAvailable: boolean) {
  const supabase = await createClient()
  await supabase
    .from('products')
    .update({ is_available: isAvailable })
    .eq('id', id)
    .eq('shop_id', SHOP_ID)
  revalidatePath('/admin/menu')
}
