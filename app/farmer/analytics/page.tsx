"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { FarmerSidebar } from "@/components/farmer/farmer-sidebar"
import { SalesAnalytics } from "@/components/farmer/sales-analytics"
import { useAuth } from "@/hooks/use-auth"

export default function FarmerAnalyticsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated || user?.role !== "farmer") {
      router.replace("/login")
    }
  }, [hasHydrated, isAuthenticated, user, router])

  if (!hasHydrated) {
    return null
  }

  if (!isAuthenticated || user?.role !== "farmer") {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <FarmerSidebar />
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Sales Analytics</h1>
            <p className="text-muted-foreground">Track your farm's performance and growth</p>
          </div>
          <SalesAnalytics />
        </div>
      </div>
    </div>
  )
}
