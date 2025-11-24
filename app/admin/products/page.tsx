"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { ProductManagement } from "@/components/admin/product-management"
import { useAuth } from "@/hooks/use-auth"

export default function AdminProductsPage() {
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
            <h1 className="text-3xl font-bold mb-2">Product Management</h1>
            <p className="text-muted-foreground">Oversee all products and farmer listings</p>
          </div>

          <ProductManagement />
        </div>
      </div>
    </div>
  )
}
