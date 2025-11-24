"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminAnalytics } from "@/components/admin/admin-analytics";
import { useAuth } from "@/hooks/use-auth";

export default function AdminAnalyticsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="flex">
        <AdminSidebar />

        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive platform analytics and insights
            </p>
          </div>

          <AdminAnalytics />
        </div>
      </div>
    </div>
  );
}
