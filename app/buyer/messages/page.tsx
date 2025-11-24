"use client"

import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { BuyerMessagingInterface } from "@/components/buyer/messaging-interface"
import { useAuth } from "@/hooks/use-auth"

export default function BuyerMessagesPage() {
  const { user, isAuthenticated, hasHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated || user?.role !== "buyer") {
      router.replace("/login")
    }
  }, [hasHydrated, isAuthenticated, user, router])

  if (!hasHydrated) {
    return null
  }

  if (!isAuthenticated || user?.role !== "buyer") {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">Chat with farmers and sellers</p>
        </div>
        <Suspense fallback={<div>Loading messages...</div>}>
          <BuyerMessagingInterface />
        </Suspense>
      </div>
    </div>
  )
}

