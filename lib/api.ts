// API Configuration for connecting frontend to backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// API client class
class ApiClient {
  private baseURL: string
  private pendingRequests: Map<string, Promise<any>>
  private cacheStore: Map<string, { expiry: number; data: any }>
  private defaultGetTtlMs: number
  private requestTimeoutMs: number
  private maxRetries: number

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.pendingRequests = new Map()
    this.cacheStore = new Map()
    this.defaultGetTtlMs = 30000
    this.requestTimeoutMs = 12000
    this.maxRetries = 2
  }

  private buildUrl(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${this.baseURL}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }
    return url.toString()
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, any>; cacheTtlMs?: number } = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params)

    const { params, cacheTtlMs, ...init } = options as any
    const config: RequestInit = {
      headers: {
        ...(options.headers || {}),
      },
      ...init,
    }

    // If body is plain object, stringify and set JSON content-type. If FormData, let browser set boundary.
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body)
      ;(config.headers as Record<string, string>)['Content-Type'] = 'application/json'
    } else if (config.body instanceof FormData) {
      // For FormData, ensure we don't set Content-Type so browser can set it with boundary
      delete (config.headers as Record<string, string>)['Content-Type']
    }

    // Add auth token if available (guard for SSR)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken')
      if (token) {
        ;(config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
      }
    }

    const method = (config.method || 'GET').toString().toUpperCase()
    const bodyString = typeof (config as any).body === 'string' ? (config as any).body : ''
    const cacheKey = `${method}:${url}:${bodyString}`

    // Serve from cache for GETs
    if (method === 'GET') {
      const cached = this.cacheStore.get(cacheKey)
      if (cached && cached.expiry > Date.now()) {
        return cached.data as T
      }
    }

    // Deduplicate in-flight requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T>
    }

    const doRequest = async (): Promise<T> => {
      let attempt = 0
      let lastError: any = null
      while (attempt <= this.maxRetries) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs)
        try {
          const resp = await fetch(url, { ...config, signal: controller.signal })
          clearTimeout(timeout)
          const json = await resp.json().catch(() => ({} as any))

          // If unauthorized, clear invalid token and retry once for public GETs
          if (!resp.ok && resp.status === 401 && typeof window !== 'undefined') {
            const hadToken = !!localStorage.getItem('authToken')
            if (hadToken) {
              localStorage.removeItem('authToken')
            }
            if (method === 'GET') {
              const retryHeaders = { ...(config.headers as Record<string, string>) }
              delete (retryHeaders as any)['Authorization']
              const retryResp = await fetch(url, { ...config, headers: retryHeaders, signal: controller.signal })
              const retryJson = await retryResp.json().catch(() => ({} as any))
              if (!retryResp.ok) {
                const message = (retryJson && (retryJson.error || retryJson.message)) || `HTTP error! status: ${retryResp.status}`
                throw new Error(message)
              }
              if (method === 'GET') {
                const ttl = (cacheTtlMs as number | undefined) ?? this.defaultGetTtlMs
                this.cacheStore.set(cacheKey, { expiry: Date.now() + ttl, data: retryJson })
              }
              return retryJson as T
            }
          }

          if (!resp.ok) {
            const status = resp.status
            // Try to get detailed error message
            let message = `HTTP error! status: ${status}`
            if (json) {
              if (json.error) {
                message = json.error
              } else if (json.message) {
                message = json.message
              } else if (json.details) {
                message = json.details
              } else if (json.field) {
                message = `${json.field}: ${json.error || json.message || 'Validation error'}`
              }
            }
            if ([429, 502, 503, 504].includes(status) && attempt < this.maxRetries) {
              const backoffMs = Math.min(1500, 250 * Math.pow(2, attempt)) + Math.floor(Math.random() * 200)
              await new Promise((r) => setTimeout(r, backoffMs))
              attempt += 1
              continue
            }
            const error = new Error(message)
            ;(error as any).status = status
            ;(error as any).response = json
            throw error
          }

          if (method === 'GET') {
            const ttl = (cacheTtlMs as number | undefined) ?? this.defaultGetTtlMs
            this.cacheStore.set(cacheKey, { expiry: Date.now() + ttl, data: json })
          }
          return json as T
        } catch (err: any) {
          clearTimeout(timeout)
          const isAbort = err?.name === 'AbortError'
          if ((isAbort || err?.message?.includes('Network')) && attempt < this.maxRetries) {
            const backoffMs = Math.min(1500, 250 * Math.pow(2, attempt)) + Math.floor(Math.random() * 200)
            await new Promise((r) => setTimeout(r, backoffMs))
            attempt += 1
            lastError = err
            continue
          }
          lastError = err
          break
        }
      }
      throw lastError || new Error('Request failed')
    }

    const inFlight = doRequest()
    this.pendingRequests.set(cacheKey, inFlight)
    try {
      const result = await inFlight
      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  get<T = any>(endpoint: string, params?: Record<string, any>) {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, { method: 'POST', body })
  }

  put<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, { method: 'PUT', body })
  }

  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  patch<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, { method: 'PATCH', body })
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL)

// Auth API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<{ user: any; token: string }>>('/auth/login', {
      email,
      password,
    }),

  register: (userData: {
    name: string
    email: string
    password: string
    role: 'buyer' | 'farmer'
    phone?: string
    address?: string
  }) =>
    apiClient.post<ApiResponse<{ user: any; token: string }>>('/auth/register', userData),

  getProfile: () =>
    apiClient.get<ApiResponse<any>>('/auth/profile'),

  updateProfile: (updates: any) =>
    apiClient.put<ApiResponse<any>>('/auth/profile', updates),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.post<ApiResponse<null>>('/auth/change-password', payload),

  deleteAccount: () => apiClient.delete<ApiResponse<null>>('/auth/account'),
}

// Products API endpoints
export const productsAPI = {
  getAll: (filters?: any) => apiClient.get<PaginatedResponse<any>>('/buyer/products', filters),

  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/buyer/products/${id}`),

  create: (productData: any) =>
    apiClient.post<ApiResponse<any>>('/farmer/products', productData),

  update: (id: string, updates: any) =>
    apiClient.put<ApiResponse<any>>(`/farmer/products/${id}`, updates),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/farmer/products/${id}`),
}

// Cart API endpoints
export const cartAPI = {
  getItems: () =>
    apiClient.get<ApiResponse<any>>('/buyer/cart'),

  addItem: (productId: string, quantity: number) =>
    apiClient.post<ApiResponse<any>>('/buyer/cart', {
      productId,
      quantity,
    }),

  updateQuantity: (productId: string, quantity: number) =>
    apiClient.put<ApiResponse<any>>(`/buyer/cart/${productId}`, {
      quantity,
    }),

  removeItem: (productId: string) =>
    apiClient.delete<ApiResponse<any>>(`/buyer/cart/${productId}`),

  clearCart: () =>
    apiClient.delete<ApiResponse<any>>('/buyer/cart'),
}

// Orders API endpoints
export const ordersAPI = {
  getAll: (filters?: any) =>
    apiClient.get<PaginatedResponse<any>>('/orders', filters),

  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/orders/details/${id}`),

  create: (orderData: {
  buyer_id: string
  farmer_id: string
  delivery_address: string
  total_price: number
  items: {
    product_id: string
    quantity: number
    price_per_unit: number
  }[]
  razorpay_order_id?: string
  razorpay_payment_id?: string
  notes?: string
}) =>
  apiClient.post('/buyer/checkout', {
    ...orderData,
    token: `Bearer ${localStorage.getItem("token")}`,
  }),




  updateStatus: (id: string, status: string, notes?: string) =>
    apiClient.patch<ApiResponse<any>>(`/farmer/orders/${id}/status`, {
      status,
      notes,
    }),
}

// Farmer API endpoints
export const farmerAPI = {
  getMyProducts: (filters?: any) => apiClient.get<PaginatedResponse<any>>('/farmer/products', filters),

  updateStock: (productId: string, stock: number) =>
    apiClient.patch<ApiResponse<any>>(`/farmer/inventory/${productId}/stock`, { stock }),

  getProfile: () => apiClient.get<ApiResponse<any>>('/farmer/profile'),

  getOrders: (filters?: any) => apiClient.get<PaginatedResponse<any>>('/farmer/orders', filters),

  getMessages: (filters?: any) => apiClient.get<ApiResponse<any>>('/farmer/messages', filters),

  getConversation: (conversationWith: string, page?: number, limit?: number) =>
    apiClient.get<PaginatedResponse<any>>('/farmer/messages', { conversationWith, page, limit }),

  sendMessage: (receiverId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text') =>
    apiClient.post<ApiResponse<any>>('/farmer/messages', { receiverId, content, messageType }),
}

// Buyer API endpoints
export const buyerAPI = {
  getMessages: (filters?: any) => apiClient.get<ApiResponse<any>>('/buyer/messages', filters),

  getConversation: (conversationWith: string, page?: number, limit?: number) =>
    apiClient.get<PaginatedResponse<any>>('/buyer/messages', { conversationWith, page, limit }),

  sendMessage: (receiverId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text') =>
    apiClient.post<ApiResponse<any>>('/buyer/messages', { receiverId, content, messageType }),
}

// User management API endpoints
export const usersAPI = {
  getAll: (filters?: any) =>
    apiClient.get<PaginatedResponse<any>>('/admin/users', filters),

  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/admin/users/${id}`),

  toggleStatus: (id: string, isActive: boolean, reason?: string) =>
    apiClient.patch<ApiResponse<any>>(`/admin/users/${id}/status`, {
      isActive,
      reason,
    }),
}

// Analytics API endpoints
export const analyticsAPI = {
  getDashboard: () =>
    apiClient.get<ApiResponse<any>>('/admin/dashboard'),

  getSalesAnalytics: (period?: string) =>
    apiClient.get<ApiResponse<any>>('/farmer/analytics/sales', { period }),

  getPlatformAnalytics: (period?: string, type?: string) =>
    apiClient.get<ApiResponse<any>>('/admin/analytics', { period, type }),
}

// Admin Orders API endpoints
export const adminOrdersAPI = {
  getAll: (filters?: any) =>
    apiClient.get<PaginatedResponse<any>>('/admin/orders', filters),

  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/admin/orders/${id}`),

  updateStatus: (id: string, status: string, notes?: string) =>
    apiClient.patch<ApiResponse<any>>(`/admin/orders/${id}/status`, {
      status,
      notes,
    }),

  exportOrders: (format?: string, startDate?: string, endDate?: string) =>
    apiClient.get<ApiResponse<any>>('/admin/export/orders', { format, startDate, endDate }),
}

// Admin Products API endpoints
export const adminProductsAPI = {
  getAll: (filters?: any) =>
    apiClient.get<PaginatedResponse<any>>('/admin/products', filters),

  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/admin/products/${id}`),

  updateStatus: (id: string, isActive: boolean, reason?: string) =>
    apiClient.patch<ApiResponse<any>>(`/admin/products/${id}/status`, {
      isActive,
      reason,
    }),

  exportProducts: (format?: string) =>
    apiClient.get<ApiResponse<any>>('/admin/export/products', { format }),
}

// Admin Disputes API endpoints
export const adminDisputesAPI = {
  getAll: (filters?: any) =>
    apiClient.get<PaginatedResponse<any>>('/admin/disputes', filters),

  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/admin/disputes/${id}`),

  updateStatus: (id: string, status: string, resolution?: string) =>
    apiClient.patch<ApiResponse<any>>(`/admin/disputes/${id}`, {
      status,
      resolution,
    }),
}

// Farmers API endpoints
export const farmersAPI = {
  getAll: (filters?: any) =>
    apiClient.get<PaginatedResponse<any>>('/admin/farmers', filters),

  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/admin/farmers/${id}`),
}
