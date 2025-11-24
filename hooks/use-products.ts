"use client"

import { create } from "zustand"
import { productsAPI } from "@/lib/api"

export interface Product {
  id: string
  title: string
  description: string
  price: number
  stock: number
  category: string
  photos: string[]
  unit: string
  is_organic: boolean
  harvest_date?: string
  expiry_date?: string
  is_active: boolean
  farmer: {
    id: string
    name: string
    email: string
    phone?: string
  }
  created_at: string
  updated_at: string
}

interface ProductsState {
  products: Product[]
  currentProduct: Product | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    search?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    isOrganic?: boolean
    inStock?: boolean
    sortBy: string
    sortOrder: string
  }
  fetchProducts: (filters?: any) => Promise<void>
  fetchProductById: (id: string) => Promise<void>
  createProduct: (productData: any) => Promise<void>
  updateProduct: (id: string, updates: any) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  setFilters: (filters: any) => void
  clearFilters: () => void
}

export const useProducts = create<ProductsState>()((set, get) => ({
  products: [],
  currentProduct: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {
    search: undefined,
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    isOrganic: undefined,
    inStock: undefined,
    sortBy: "created_at",
    sortOrder: "desc",
  },

  fetchProducts: async (filters?: any) => {
    set({ isLoading: true, error: null })
    try {
      const currentFilters = { ...get().filters, ...filters }
      const response = await productsAPI.getAll(currentFilters)
      
      if (response.success && response.data) {
        set({ 
          products: response.data.data || [],
          pagination: response.data.pagination || get().pagination
        })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch products' })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchProductById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await productsAPI.getById(id)
      if (response.success && response.data) {
        set({ currentProduct: response.data.data })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch product' })
    } finally {
      set({ isLoading: false })
    }
  },

  createProduct: async (productData: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await productsAPI.create(productData)
      if (response.success) {
        // Refresh products list
        await get().fetchProducts()
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create product' })
    } finally {
      set({ isLoading: false })
    }
  },

  updateProduct: async (id: string, updates: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await productsAPI.update(id, updates)
      if (response.success) {
        // Update current product if it's the one being updated
        set((state) => ({
          currentProduct: state.currentProduct?.id === id 
            ? { ...state.currentProduct, ...updates }
            : state.currentProduct
        }))
        // Refresh products list
        await get().fetchProducts()
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update product' })
    } finally {
      set({ isLoading: false })
    }
  },

  deleteProduct: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await productsAPI.delete(id)
      if (response.success) {
        // Remove from current list
        set((state) => ({
          products: state.products.filter(p => p.id !== id),
          currentProduct: state.currentProduct?.id === id ? null : state.currentProduct
        }))
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete product' })
    } finally {
      set({ isLoading: false })
    }
  },

  setFilters: (filters: any) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 } // Reset to first page when filters change
    }))
  },

  clearFilters: () => {
    set((state) => ({
      filters: {
        search: undefined,
        category: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        isOrganic: undefined,
        inStock: undefined,
        sortBy: "created_at",
        sortOrder: "desc",
      },
      pagination: { ...state.pagination, page: 1 }
    }))
  },
}))
