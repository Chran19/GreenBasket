"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { FarmerSidebar } from "@/components/farmer/farmer-sidebar";
import { MessagingInterface } from "@/components/farmer/messaging-interface";
import { useAuth } from "@/hooks/use-auth";

export default function FarmerMessagesPage() {
  const { user, isAuthenticated, hasHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || user?.role !== "farmer") {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!hasHydrated) return null;
  if (!isAuthenticated || user?.role !== "farmer") return null;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <FarmerSidebar />
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with your customers
            </p>
          </div>
          <Suspense fallback={<div>Loading messages...</div>}>
            <MessagingInterface />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
