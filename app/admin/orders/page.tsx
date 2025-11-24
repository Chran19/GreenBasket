"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { OrderManagement } from "@/components/admin/order-management"
import { useAuth } from "@/hooks/use-auth"

export default function AdminOrdersPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="flex">
        <AdminSidebar />

        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Order Management</h1>
            <p className="text-muted-foreground">Track and manage all platform orders</p>
          </div>

          <OrderManagement />
        </div>
      </div>
    </div>
  )
}
