import type { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/utils/constants'
import { createTrustedOrder, OrderRejectedError, type OrderRequest } from './create-order'

type Client = ReturnType<typeof createClient>
type Channel = 'customer' | 'pos'
interface PendingAttempt { key: string; signature: string }
const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

function storageKey(userId: string, channel: Channel) {
  return `tcs-order-attempt:v1:${SHOP_ID}:${userId}:${channel}`
}

function read(key: string): PendingAttempt | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  const value = JSON.parse(raw)
  if (!value || typeof value.key !== 'string' || !uuid.test(value.key) ||
      typeof value.signature !== 'string' || !/^[0-9a-f]{64}$/.test(value.signature)) {
    throw new Error('Data checkout tidak valid. Hubungi kasir sebelum mencoba lagi.')
  }
  return value
}

async function locked<T>(key: string, action: () => Promise<T>): Promise<T> {
  // Never silently fall back to an unsafe read/write race between tabs.
  if (!navigator.locks) throw new Error('Browser tidak mendukung checkout aman. Gunakan browser terbaru.')
  return navigator.locks.request(key, { ifAvailable: true }, async (lock) => {
    if (!lock) throw new Error('Checkout sedang diproses di tab lain. Tunggu lalu coba lagi.')
    return action()
  })
}

export async function placePendingOrder(client: Client, userId: string, channel: Channel, request: OrderRequest) {
  const name = storageKey(userId, channel)
  return locked(name, async () => {
    // Persist only a digest and random request key, never cart contents or payment details.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(request)))
    const signature = Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, '0')).join('')
    let attempt = read(name)
    if (attempt && attempt.signature !== signature) {
      throw new Error('Checkout sebelumnya belum selesai. Buka ulang halaman untuk melanjutkan atau hubungi kasir.')
    }
    if (!attempt) {
      attempt = { key: crypto.randomUUID(), signature }
      // A storage failure must stop checkout before any order is submitted.
      localStorage.setItem(name, JSON.stringify(attempt))
    }
    let order
    try { order = await createTrustedOrder(client, request, attempt.key) }
    catch (cause) {
      // Only a definite transaction rejection permits editing/replacing the attempt.
      // Lost responses, timeouts and unclassified errors retain the original key.
      if (cause instanceof OrderRejectedError) localStorage.removeItem(name)
      throw cause
    }
    const { data, error } = await client.from('orders')
      .select('status, payment_status, payment_method').eq('id', order.id).eq('shop_id', SHOP_ID).single()
    if (error || !data) throw new Error('Gagal memeriksa pembayaran. Muat ulang sebelum mencoba lagi.')
    return { ...order, ...data, attemptKey: attempt.key }
  })
}

export async function recoverPendingOrder(client: Client, userId: string, channel: Channel) {
  const name = storageKey(userId, channel)
  return locked(name, async () => {
    const attempt = read(name)
    if (!attempt) return null
    const { data, error } = await client.from('orders')
      .select('id, total, status, payment_status, payment_method')
      .eq('customer_id', userId).eq('shop_id', SHOP_ID).eq('idempotency_key', attempt.key).maybeSingle()
    if (error) throw new Error('Gagal memeriksa checkout sebelumnya. Coba muat ulang halaman.')
    return data ? { ...data, attemptKey: attempt.key } : null
  })
}

export async function finishPendingOrder(userId: string, channel: Channel, attemptKey: string) {
  const name = storageKey(userId, channel)
  await locked(name, async () => {
    // A stale tab must never delete a newer attempt.
    if (read(name)?.key === attemptKey) localStorage.removeItem(name)
  })
}
