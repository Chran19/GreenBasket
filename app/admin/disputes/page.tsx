"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { DisputeManagement } from "@/components/admin/dispute-management"
import { useAuth } from "@/hooks/use-auth"



export default function AdminDisputesPage() {
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
            <h1 className="text-3xl font-bold mb-2">Dispute Resolution</h1>
            <p className="text-muted-foreground">Handle customer disputes and issues</p>
          </div>

          <DisputeManagement />
        </div>
      </div>
    </div>
  )
}
