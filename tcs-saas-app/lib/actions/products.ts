'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireShopAdmin } from '@/lib/auth/require-shop-admin'
import { SHOP_ID } from '@/lib/utils/constants'

interface CoffeeProfile {
  body: number
  acidity: number
  freshness: number
  sweetness: number
  creaminess: number
  aroma: number
}

interface ProductData {
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
  imageUrl?: string | null
  coffeeProfile?: CoffeeProfile | null
  ingredients?: Array<{ name: string; icon_slug: string }> | null
}

export async function createProduct(data: ProductData) {
  const supabase = await requireShopAdmin()
  validateProduct(data)
  const { error } = await supabase.from('products').insert({
    shop_id: SHOP_ID,
    name: data.name,
    description: data.description || null,
    price: data.price,
    category: data.category,
    is_available: data.isAvailable,
    image_url: data.imageUrl ?? null,
    coffee_profile: data.coffeeProfile ?? null,
    ingredients: data.ingredients ?? null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/menu')
  redirect('/admin/menu')
}

export async function updateProduct(id: string, data: ProductData) {
  const supabase = await requireShopAdmin()
  validateId(id)
  validateProduct(data)
  const { error } = await supabase
    .from('products')
    .update({
      name: data.name,
      description: data.description || null,
      price: data.price,
      category: data.category,
      is_available: data.isAvailable,
      ...(data.imageUrl !== undefined ? { image_url: data.imageUrl } : {}),
      coffee_profile: data.coffeeProfile ?? null,
      ingredients: data.ingredients ?? null,
    })
    .eq('id', id)
    .eq('shop_id', SHOP_ID)
    .select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin/menu')
  redirect('/admin/menu')
}

export async function deleteProduct(id: string) {
  const supabase = await requireShopAdmin()
  validateId(id)
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('shop_id', SHOP_ID)
    .select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin/menu')
  redirect('/admin/menu')
}

export async function toggleProductAvailability(id: string, isAvailable: boolean) {
  const supabase = await requireShopAdmin()
  validateId(id)
  if (typeof isAvailable !== 'boolean') throw new Error('Invalid availability')
  const { error } = await supabase
    .from('products')
    .update({ is_available: isAvailable })
    .eq('id', id)
    .eq('shop_id', SHOP_ID)
    .select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin/menu')
}

function validateId(id: string) {
  if (typeof id !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Invalid product ID')
  }
}

function validateProduct(data: ProductData) {
  if (!data || typeof data !== 'object' ||
      typeof data.name !== 'string' || !data.name.trim() || data.name.length > 200 ||
      typeof data.description !== 'string' || data.description.length > 5000 ||
      typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0 || data.price > 99999999.99 ||
      !['coffee', 'non-coffee', 'food', 'merchandise'].includes(data.category) ||
      typeof data.isAvailable !== 'boolean') throw new Error('Invalid product data')
  if (data.imageUrl != null) {
    if (typeof data.imageUrl !== 'string' || data.imageUrl.length > 2048) throw new Error('Invalid image URL')
    if (data.imageUrl && new URL(data.imageUrl).protocol !== 'https:') throw new Error('Invalid image URL')
  }
  if (data.coffeeProfile != null && (
    typeof data.coffeeProfile !== 'object' ||
    !['body', 'acidity', 'freshness', 'sweetness', 'creaminess', 'aroma'].every((key) => {
      const value = data.coffeeProfile![key as keyof CoffeeProfile]
      return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
    })
  )) throw new Error('Invalid coffee profile')
  if (data.ingredients != null && (!Array.isArray(data.ingredients) || data.ingredients.length > 50 ||
      data.ingredients.some((item) => !item || typeof item.name !== 'string' || item.name.length > 200 ||
        typeof item.icon_slug !== 'string' || item.icon_slug.length > 100))) throw new Error('Invalid ingredients')
}
