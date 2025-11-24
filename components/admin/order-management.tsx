"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { adminOrdersAPI } from "@/lib/api";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Calendar,
  Package,
  User,
  DollarSign,
} from "lucide-react";
import Image from "next/image";

interface Order {
  id: string;
  status: string;
  total_price: number;
  commission_amount: number;
  delivery_address: string;
  created_at: string;
  buyer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  farmer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  order_items: Array<{
    id: string;
    quantity: number;
    price_per_unit: number;
    total_price: number;
    product: {
      id: string;
      title: string;
      photos: string[];
      unit: string;
    };
  }>;
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    startDate: "",
    endDate: "",
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await adminOrdersAPI.getAll(params);
      const data = response.data || [];
      setOrders(data);
      setTotalOrders(response.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentPage, filters]);

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await adminOrdersAPI.updateStatus(
        selectedOrder.id,
        newStatus,
        statusNotes
      );
      setStatusUpdateDialog(false);
      setNewStatus("");
      setStatusNotes("");
      setSelectedOrder(null);
      loadOrders(); // Refresh the list
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      confirmed: { color: "bg-blue-100 text-blue-800", label: "Confirmed" },
      shipped: { color: "bg-purple-100 text-purple-800", label: "Shipped" },
      delivered: { color: "bg-green-100 text-green-800", label: "Delivered" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const exportOrders = () => {
    if (!orders || orders.length === 0) {
      alert("No orders available to export");
      return;
    }

    const csvRows: string[] = [];

    // CSV header
    csvRows.push(
      [
        "Order ID",
        "Status",
        "Total Price",
        "Commission Amount",
        "Buyer Name",
        "Buyer Email",
        "Farmer Name",
        "Farmer Email",
        "Items Count",
        "Delivery Address",
        "Order Date",
      ].join(",")
    );

    // CSV rows
    orders.forEach((o) => {
      csvRows.push(
        [
          o.id,
          o.status,
          o.total_price,
          o.commission_amount || 0,
          `"${o.buyer.name}"`,
          o.buyer.email,
          `"${o.farmer.name}"`,
          o.farmer.email,
          o.order_items.length,
          `"${o.delivery_address.replace(/"/g, "'")}"`, // prevent CSV break
          new Date(o.created_at).toLocaleString(),
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalOrders / 20);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Orders ({totalOrders})</h2>
          <p className="text-muted-foreground">
            Manage and track all platform orders
          </p>
        </div>
        <Button onClick={exportOrders} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading orders...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Order ID</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Farmer</th>
                    <th className="text-left p-4 font-medium">Items</th>
                    <th className="text-left p-4 font-medium">Total</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="p-4 font-mono text-sm">{order.id}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{order.buyer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.buyer.email}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{order.farmer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.farmer.email}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {order.order_items.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2"
                            >
                              <div className="w-8 h-8 relative rounded overflow-hidden">
                                <Image
                                  src={
                                    item.product.photos?.[0] ||
                                    "/placeholder.png"
                                  }
                                  alt={item.product.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {item.product.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.quantity} {item.product.unit}
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.order_items.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{order.order_items.length - 2} more items
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">
                            ₹{Number(order.total_price).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Commission: ₹
                            {Number(order.commission_amount || 0).toFixed(2)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Order Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium">Customer</h4>
                                    <p>{order.buyer.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {order.buyer.email}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {order.buyer.phone}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Farmer</h4>
                                    <p>{order.farmer.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {order.farmer.email}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {order.farmer.phone}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium">
                                    Delivery Address
                                  </h4>
                                  <p className="text-sm">
                                    {order.delivery_address}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Items</h4>
                                  <div className="space-y-2">
                                    {order.order_items.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="w-10 h-10 relative rounded overflow-hidden">
                                            <Image
                                              src={
                                                item.product.photos?.[0] ||
                                                "/placeholder.png"
                                              }
                                              alt={item.product.title}
                                              fill
                                              className="object-cover"
                                            />
                                          </div>
                                          <div>
                                            <p className="font-medium">
                                              {item.product.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              {item.quantity}{" "}
                                              {item.product.unit} @ ₹
                                              {item.price_per_unit}
                                            </p>
                                          </div>
                                        </div>
                                        <p className="font-medium">
                                          ₹{item.total_price}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="border-t pt-4">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Total:</span>
                                    <span className="font-bold text-lg">
                                      ₹{Number(order.total_price).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                              setStatusUpdateDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Add notes about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStatusUpdateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate}>Update Status</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
