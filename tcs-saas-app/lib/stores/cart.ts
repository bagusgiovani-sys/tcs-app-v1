import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  size?: string
  imageUrl?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  increment: (productId: string, size?: string) => void
  decrement: (productId: string, size?: string) => void
  remove: (productId: string, size?: string) => void
  clear: () => void
  total: () => number
  count: () => number
}

const key = (productId: string, size?: string) => `${productId}__${size ?? ''}`

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const k = key(item.productId, item.size)
        const qty = item.quantity ?? 1
        set((state) => {
          const existing = state.items.find((i) => key(i.productId, i.size) === k)
          if (existing) {
            return {
              items: state.items.map((i) =>
                key(i.productId, i.size) === k ? { ...i, quantity: i.quantity + qty } : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: qty }] }
        })
      },

      increment: (productId, size) => {
        const k = key(productId, size)
        set((state) => ({
          items: state.items.map((i) =>
            key(i.productId, i.size) === k ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }))
      },

      decrement: (productId, size) => {
        const k = key(productId, size)
        set((state) => ({
          items: state.items
            .map((i) => key(i.productId, i.size) === k ? { ...i, quantity: i.quantity - 1 } : i)
            .filter((i) => i.quantity > 0),
        }))
      },

      remove: (productId, size) => {
        const k = key(productId, size)
        set((state) => ({ items: state.items.filter((i) => key(i.productId, i.size) !== k) }))
      },

      clear: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'tcs-cart' }
  )
)
