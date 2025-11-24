"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/lib/auth"
import { logoutUser } from "@/lib/auth"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  hasHydrated: boolean
  login: (user: User) => void
  logout: () => void
  setUser: (user: User | null) => void
  updateUser: (updatedUser: User) => void
  setHydrated: (value: boolean) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (user: User) => set({ user, isAuthenticated: true }),
      logout: () => {
        logoutUser()
        set({ user: null, isAuthenticated: false })
      },
      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: Boolean(user),
        }),
      updateUser: (updatedUser: User) =>
        set({
          user: updatedUser,
          isAuthenticated: Boolean(updatedUser),
        }),
      setHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.setUser(state.user)
        state.setHydrated(true)
      },
      version: 1,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
