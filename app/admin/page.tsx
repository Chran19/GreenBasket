"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function AdminDashboard() {
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

  const recentActivity = [
    {
      id: "1",
      type: "user",
      message: "New farmer registration: Green Valley Farm",
      time: "2 hours ago",
      status: "pending",
    },
    {
      id: "2",
      type: "order",
      message: "High-value order placed: ₹245.50",
      time: "3 hours ago",
      status: "completed",
    },
    {
      id: "3",
      type: "dispute",
      message: "Product quality dispute reported",
      time: "5 hours ago",
      status: "pending",
    },
    {
      id: "4",
      type: "product",
      message: "New product added: Organic Strawberries",
      time: "1 day ago",
      status: "approved",
    },
  ];

  const pendingActions = [
    {
      id: "1",
      title: "Farmer Applications",
      count: 3,
      description: "New farmer registrations awaiting approval",
      priority: "high",
    },
    {
      id: "2",
      title: "Product Reviews",
      count: 7,
      description: "Products pending quality review",
      priority: "medium",
    },
    {
      id: "3",
      title: "Dispute Resolution",
      count: 2,
      description: "Customer disputes requiring attention",
      priority: "high",
    },
    {
      id: "4",
      title: "System Updates",
      count: 1,
      description: "Platform maintenance scheduled",
      priority: "low",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <div className="flex">
        <AdminSidebar />

        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name}! Here's your platform overview.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              {
                icon: Users,
                value: "234",
                label: "Total Users",
                growth: "+12.5%",
              },
              {
                icon: Package,
                value: "89",
                label: "Active Products",
                growth: "+5.2%",
              },
              {
                icon: ShoppingCart,
                value: "318",
                label: "Monthly Orders",
                growth: "+18.7%",
              },
              {
                icon: DollarSign,
                value: "₹31.8K",
                label: "Monthly Revenue",
                growth: "+23.1%",
              },
            ].map((metric, i) => (
              <Card
                key={i}
                className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <metric.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <p className="text-sm text-muted-foreground">
                        {metric.label}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600">
                          {metric.growth}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Actions */}
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Pending Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-4 border rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{action.title}</p>
                        <Badge
                          variant={
                            action.priority === "high"
                              ? "destructive"
                              : action.priority === "medium"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{action.count}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 border rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="p-2 bg-muted rounded-lg">
                      {activity.status === "completed" ||
                      activity.status === "approved" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                    <Badge
                      variant={
                        activity.status === "completed" ||
                        activity.status === "approved"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card className="mt-8 transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle>Platform Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    value: "98.5%",
                    label: "System Uptime",
                    extra: "Excellent",
                    color: "text-green-600",
                  },
                  {
                    value: "4.8",
                    label: "Avg User Rating",
                    extra: "+0.2 this month",
                    color: "text-primary",
                  },
                  {
                    value: "95%",
                    label: "Order Success Rate",
                    extra: "+2% this month",
                    color: "text-secondary",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="text-center p-4 border rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xs text-green-600 mt-1">{stat.extra}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
