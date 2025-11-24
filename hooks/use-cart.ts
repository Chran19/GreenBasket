"use client"

import { create } from "zustand"
import { cartAPI } from "@/lib/api"

// Product type from backend normalized for cart UI
export type ProductRef = {
  id: string
  price: number
  name?: string
  unit?: string
  image?: string
  farmer?: string
}

export interface CartItem extends ProductRef {
  quantity: number
}

export interface CartDiscount {
  code: string;
  percentage: number;
}

interface CartState {
  items: CartItem[]
  isLoading: boolean
  error: string | null
  appliedDiscount: CartDiscount | null
  fetchCart: () => Promise<void>
  addItem: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  applyDiscount: (code: string) => void
  removeDiscount: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getDiscountAmount: () => number
}

export const useCart = create<CartState>()((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  appliedDiscount: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await cartAPI.getItems()
      if (response.success && response.data) {
        const normalized = (response.data.items || []).map((row: any) => {
          const p = row.product || {}
          return {
            id: p.id,
            price: Number.parseFloat(p.price ?? 0),
            name: p.title ?? p.name ?? "",
            unit: p.unit,
            image: (p.photos && p.photos[0]) || "/placeholder.png",
            farmer: p.farmer?.name,
            quantity: row.quantity ?? 1,
          }
        })
        set({ items: normalized })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch cart' })
    } finally {
      set({ isLoading: false })
    }
  },

  addItem: async (productId: string, quantity: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await cartAPI.addItem(productId, quantity)
      if (response.success) {
        await get().fetchCart()
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add item' })
    } finally {
      set({ isLoading: false })
    }
  },

  // 🔥 Real-time delete (optimistic)
  removeItem: async (productId: string) => {
    // Instant UI update
    set(state => ({
      items: state.items.filter(i => i.id !== productId)
    }))

    try {
      await cartAPI.removeItem(productId)
    } catch {
      await get().fetchCart()
    }
  },

  // 🔥 Real-time qty update (optimistic)
  updateQuantity: async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await get().removeItem(productId)
      return
    }

    // Instant UI update
    set(state => ({
      items: state.items.map(i =>
        i.id === productId ? { ...i, quantity } : i
      )
    }))

    try {
      await cartAPI.updateQuantity(productId, quantity)
    } catch {
      await get().fetchCart()
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await cartAPI.clearCart()
      if (response.success) {
        set({ items: [] })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to clear cart' })
    } finally {
      set({ isLoading: false })
    }
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0)
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
  },

  getDiscountAmount: () => {
    const discount = get().appliedDiscount
    if (!discount) return 0
    const subtotal = get().getTotalPrice()
    return subtotal * (discount.percentage / 100)
  },

  applyDiscount: (code: string) => {
    if (code.toUpperCase() === 'FRESH10') {
      set({ appliedDiscount: { code: 'FRESH10', percentage: 10 } })
    }
  },

  removeDiscount: () => {
    set({ appliedDiscount: null })
  },
}))
