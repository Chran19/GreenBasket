"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { FarmerSidebar } from "@/components/farmer/farmer-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  Package,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Plus,
  BarChart3,
  Warehouse as Inventory,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { farmerAPI } from "@/lib/api";

export default function FarmerDashboard() {
  const { user, isAuthenticated, hasHydrated } = useAuth();
  const router = useRouter();

  const [metrics, setMetrics] = useState({
    revenueThisMonth: 0,
    ordersThisWeek: 0,
    activeProducts: 0,
    unreadMessages: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<
    { name: string; current: number; minimum: number }[]
  >([]);

  useEffect(() => {
    if (hasHydrated) {
      if (!isAuthenticated || user?.role !== "farmer") {
        router.replace("/login");
      }
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes: any = await farmerAPI.getProfile();
        const stats = profileRes?.data?.statistics || {};
        setMetrics({
          revenueThisMonth: Number(
            stats?.revenueThisMonth ?? stats?.totalRevenue ?? 0
          ),
          ordersThisWeek: Number(
            stats?.ordersThisWeek ?? stats?.totalOrders ?? 0
          ),
          activeProducts: Number(stats?.activeProducts ?? 0),
          unreadMessages: 0,
        });

        const recent = profileRes?.data?.recentOrders || [];
        setRecentOrders(
          recent.map((o: any) => ({
            id: o.id,
            customer: o.buyer?.name || "",
            product: o.items?.[0]?.product?.title || "",
            quantity: `${o.items?.[0]?.quantity || 0} ${
              o.items?.[0]?.product?.unit || ""
            }`,
            amount: Number(o.total_price ?? 0),
            status: o.status,
          }))
        );
      } catch {}

      try {
        const productsRes: any = await farmerAPI.getMyProducts({ limit: 100 });
        const items = productsRes?.data || productsRes?.data?.data || [];
        const lows = items
          .filter((p: any) => (p.stock ?? 0) <= 10)
          .map((p: any) => ({
            name: p.title,
            current: p.stock ?? 0,
            minimum: 10,
          }));
        setLowStockAlerts(lows);
      } catch {}
    };

    if (isAuthenticated && user?.role === "farmer") load();
  }, [isAuthenticated, user]);

  if (!hasHydrated) return null;
  if (!isAuthenticated || user?.role !== "farmer") return null;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <FarmerSidebar />

        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Farmer Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name}! Here's your farm overview.
            </p>
          </div>

          {/* ---------- Metrics ---------- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="pb-2">
                <div className="p-2 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ₹{metrics.revenueThisMonth.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    +12.5% from last month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="pb-2">
                <div className="p-2 w-10 h-10 rounded-md bg-secondary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.ordersThisWeek}</p>
                <p className="text-sm text-muted-foreground">Weekly Orders</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    +8.2% from last week
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="pb-2">
                <div className="p-2 w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center">
                  <Inventory className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.activeProducts}</p>
                <p className="text-sm text-muted-foreground">Active Products</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    +5.2% from last month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="pb-2">
                <div className="p-2 w-10 h-10 rounded-md bg-chart-1/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-chart-1" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.unreadMessages}</p>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
                {metrics.unreadMessages > 0 ? (
                  <div className="mt-2">
                    <Badge variant="destructive" className="text-xs">
                      New
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">
                      All caught up
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ---------- Low Stock Alerts ---------- */}
          {lowStockAlerts.length > 0 && (
            <Card className="mb-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lowStockAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{alert.name}</p>
                        <Badge variant="destructive" className="text-xs">
                          low
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Current: {alert.current} | Minimum: {alert.minimum}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Restock
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ---------- Recent Orders + Quick Actions ---------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start gap-3 p-3 border rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                  >
                    <div className="p-2 bg-muted rounded-lg">
                      {order.status === "Completed" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {order.product} - {order.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Order #{order.id} from {order.customer}
                      </p>
                    </div>
                    <div>
                      <Badge
                        variant={
                          order.status === "Completed" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                      <p className="text-right text-sm font-medium mt-1">
                        ₹{order.amount}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: "Add New Product",
                    href: "/farmer/products/new",
                    icon: Plus,
                    primary: true,
                  },
                  {
                    title: "View Sales Analytics",
                    href: "/farmer/analytics",
                    icon: BarChart3,
                    primary: false,
                  },
                  {
                    title: "Manage Inventory",
                    href: "/farmer/inventory",
                    icon: Inventory,
                    primary: false,
                  },
                  {
                    title: "Check Messages",
                    href: "/farmer/messages",
                    icon: MessageCircle,
                    primary: false,
                    badge: "5",
                  },
                ].map((action, index) => (
                  <Button
                    key={index}
                    variant={action.primary ? "default" : "outline"}
                    className="w-full justify-start h-12 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    asChild
                  >
                    <a href={action.href}>
                      <action.icon className="h-5 w-5 mr-3" />
                      {action.title}
                      {action.badge && (
                        <Badge variant="destructive" className="ml-auto">
                          {action.badge}
                        </Badge>
                      )}
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ---------- Performance Overview ---------- */}
          <Card className="mt-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader>
              <CardTitle>Farm Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <p className="text-2xl font-bold text-primary">₹847</p>
                  <p className="text-sm text-muted-foreground">
                    Weekly Revenue
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    +15% from last week
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <p className="text-2xl font-bold text-secondary">18</p>
                  <p className="text-sm text-muted-foreground">Weekly Orders</p>
                  <p className="text-xs text-green-600 mt-1">
                    +3 from last week
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <p className="text-2xl font-bold text-accent">4.9</p>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-xs text-green-600 mt-1">
                    +0.2 from last week
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
