"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  ShoppingCart,
  Heart,
  Package,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react";
import { ordersAPI, productsAPI, wishlistAPI } from "@/lib/api";
import Link from "next/link";

export default function BuyerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    favorites: 0,
    subscriptions: 0,
    avgRating: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.role !== "buyer") router.push("/login");
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "buyer") return;

    const load = async () => {
      try {
        const ordersRes: any = await ordersAPI.getAll({ page: 1, limit: 5 });
        const orders = ordersRes?.data || ordersRes?.data?.data || [];
        setRecentOrders(
          orders.map((o: any) => ({
            id: o.id,
            date: (o.created_at || new Date().toISOString()).split("T")[0],
            status: o.status,
            total: Number(o.total_price ?? 0),
            items: (o.order_items || o.items || []).length,
          }))
        );
        setStats((s) => ({
          ...s,
          totalOrders: ordersRes?.pagination?.total ?? orders.length,
        }));
      } catch {}

      try {
        const wishlist = await wishlistAPI.getAll();
        setStats((s) => ({
          ...s,
          favorites: wishlist?.data?.length || 0,
        }));
      } catch {}

      try {
        const prodRes: any = await productsAPI.getAll({
          limit: 8,
          sortBy: "created_at",
          sortOrder: "desc",
        });
        const items = prodRes?.data || prodRes?.data?.data || [];
        setRecommendations(
          items.map((p: any) => ({
            id: p.id,
            name: p.title,
            price: Number(p.price ?? 0),
            image: p.photos?.[0] || "/placeholder.png",
            rating: p.averageRating ?? 4.5,
          }))
        );
      } catch {}
    };

    load();
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== "buyer") return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's fresh for you today
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Total Orders",
              value: stats.totalOrders,
              icon: <ShoppingCart className="h-6 w-6 text-primary" />,
              bg: "bg-primary/10",
            },
            {
              label: "Favorites",
              value: stats.favorites,
              icon: <Heart className="h-6 w-6 text-red-500" />,
              bg: "bg-red-500/10",
            },
            {
              label: "Active Subscription",
              value: stats.subscriptions,
              icon: <Package className="h-6 w-6 text-purple-500" />,
              bg: "bg-purple-500/10",
            },
            {
              label: "Avg Rating Given",
              value: stats.avgRating || 4.9,
              icon: <Star className="h-6 w-6 text-yellow-500" />,
              bg: "bg-yellow-500/10",
            },
          ].map((item, i) => (
            <Card key={i} className="hover:scale-[1.02] transition">
              <CardContent className="p-6 flex gap-4 items-center">
                <div className={`${item.bg} p-3 rounded-lg`}>{item.icon}</div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Orders
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/orders">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition"
                >
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.date}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.items} items
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        order.status === "Delivered" ? "default" : "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                    <p className="font-medium mt-1">₹{order.total}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommended for You
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/products">Browse All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-lg hover:scale-[1.01] transition"
                >
                  <Link href={`/product/${product.id}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                      onError={(e) =>
                        (e.currentTarget.src = "/placeholder.png")
                      }
                    />
                  </Link>

                  <div className="flex-1 cursor-pointer">
                    <Link href={`/product/${product.id}`}>
                      <p className="font-medium hover:underline">
                        {product.name}
                      </p>
                    </Link>

                    <div className="flex items-center gap-2 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground">
                        {product.rating}
                      </span>
                    </div>
                  </div>

                  <div className="text-right w-32">
                    <p className="font-semibold text-lg">₹{product.price}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="flex-1">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      <Button size="sm" variant="outline">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Shortcuts */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="h-16" asChild>
            <Link href="/products" className="flex flex-col items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              <span>Browse Products</span>
            </Link>
          </Button>

          <Button variant="outline" className="h-16" asChild>
            <Link
              href="/subscription"
              className="flex flex-col items-center gap-2"
            >
              <Package className="h-6 w-6" />
              <span>Manage Subscription</span>
            </Link>
          </Button>

          <Button variant="outline" className="h-16" asChild>
            <Link href="/wishlist" className="flex flex-col items-center gap-2">
              <Heart className="h-6 w-6" />
              <span>View Wishlist</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
