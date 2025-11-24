import { authAPI } from './api'

export type UserRole = "buyer" | "farmer" | "admin"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  phone?: string
  address?: string
  bio?: string
}

// Real API authentication
export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const response = await authAPI.login(email, password)
    if (response.success && response.data) {
      // Store the token in localStorage
      localStorage.setItem('authToken', response.data.token)
      return response.data.user
    }
    return null
  } catch (error) {
    console.error('Login failed:', error)
    return null
  }
}

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: UserRole,
  phone?: string,
  address?: string,
): Promise<User | null> => {
  try {
    const response = await authAPI.register({
      name,
      email,
      password,
      role,
      phone,
      address,
    })
    if (response.success && response.data) {
      // Store the token in localStorage
      localStorage.setItem('authToken', response.data.token)
      return response.data.user
    }
    return null
  } catch (error) {
    console.error('Registration failed:', error)
    return null
  }
}

export const logoutUser = () => {
  localStorage.removeItem('authToken')
}

export const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem('authToken')
  if (!token) return null

  try {
    const res = await authAPI.getProfile()
    if (res.success && res.data) return res.data
    return null
  } catch (err) {
    return null
  }
}

