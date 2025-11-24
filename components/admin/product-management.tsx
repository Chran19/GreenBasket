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
import { adminProductsAPI } from "@/lib/api";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Package,
  User,
  DollarSign,
  Tag,
  Leaf,
  IndianRupee,
} from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
  is_organic: boolean;
  is_active: boolean;
  photos: string[];
  created_at: string;
  farmer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: "",
    isActive: "",
    search: "",
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState(false);
  const [statusReason, setStatusReason] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (filters.category) params.category = filters.category;
      if (filters.isActive !== "")
        params.isActive = filters.isActive === "true";
      if (filters.search) params.search = filters.search;

      const response = await adminProductsAPI.getAll(params);
      const data = response.data || [];
      setProducts(data);
      setTotalProducts(response.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [currentPage, filters]);

  const handleStatusUpdate = async () => {
    if (!selectedProduct) return;

    try {
      await adminProductsAPI.updateStatus(
        selectedProduct.id,
        newStatus,
        statusReason
      );
      setStatusUpdateDialog(false);
      setNewStatus(false);
      setStatusReason("");
      setSelectedProduct(null);
      loadProducts(); // Refresh the list
    } catch (error) {
      console.error("Failed to update product status:", error);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      vegetables: "bg-green-100 text-green-800",
      fruits: "bg-orange-100 text-orange-800",
      grains: "bg-yellow-100 text-yellow-800",
      dairy: "bg-blue-100 text-blue-800",
      meat: "bg-red-100 text-red-800",
      poultry: "bg-purple-100 text-purple-800",
    };

    const color =
      categoryColors[category as keyof typeof categoryColors] ||
      "bg-gray-100 text-gray-800";
    return <Badge className={color}>{category}</Badge>;
  };

  const exportProducts = () => {
    if (!products || products.length === 0) {
      alert("No products available to export");
      return;
    }

    const csvRows = [];

    // CSV header
    csvRows.push(
      [
        "ID",
        "Title",
        "Category",
        "Price",
        "Stock",
        "Unit",
        "Organic",
        "Active",
        "Farmer Name",
        "Farmer Email",
        "Created At",
      ].join(",")
    );

    // CSV rows
    products.forEach((p) => {
      csvRows.push(
        [
          p.id,
          `"${p.title}"`,
          p.category,
          p.price,
          p.stock,
          p.unit,
          p.is_organic ? "Yes" : "No",
          p.is_active ? "Active" : "Inactive",
          `"${p.farmer.name}"`,
          p.farmer.email,
          p.created_at,
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalProducts / 20);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters({ ...filters, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="meat">Meat</SelectItem>
                  <SelectItem value="poultry">Poultry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.isActive}
                onValueChange={(value) =>
                  setFilters({ ...filters, isActive: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Products ({totalProducts})</h2>
          <p className="text-muted-foreground">
            Manage all products and farmer listings
          </p>
        </div>
        <Button onClick={exportProducts} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading products...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Farmer</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-left p-4 font-medium">Price</th>
                    <th className="text-left p-4 font-medium">Stock</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 relative rounded overflow-hidden">
                            <Image
                              src={product.photos?.[0] || "/placeholder.png"}
                              alt={product.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{product.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {product.is_organic && (
                                <Badge variant="outline" className="text-xs">
                                  <Leaf className="h-3 w-3 mr-1" />
                                  Organic
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {product.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{product.farmer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.farmer.email}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        {getCategoryBadge(product.category)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {Number(product.price).toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span
                            className={
                              product.stock <= 10
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {product.stock}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(product.is_active)}
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
                                <DialogTitle>Product Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                  <div className="w-24 h-24 relative rounded overflow-hidden flex-shrink-0">
                                    <Image
                                      src={
                                        product.photos?.[0] ||
                                        "/placeholder.png"
                                      }
                                      alt={product.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2">
                                      {product.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                      {getCategoryBadge(product.category)}
                                      {product.is_organic && (
                                        <Badge variant="outline">
                                          <Leaf className="h-3 w-3 mr-1" />
                                          Organic
                                        </Badge>
                                      )}
                                      {getStatusBadge(product.is_active)}
                                    </div>
                                    <p className="text-muted-foreground mb-3">
                                      {product.description}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">
                                          Price:
                                        </span>{" "}
                                        ₹{Number(product.price).toFixed(2)}/
                                        {product.unit}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Stock:
                                        </span>{" "}
                                        {product.stock} {product.unit}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="border-t pt-4">
                                  <h4 className="font-medium mb-2">
                                    Farmer Information
                                  </h4>
                                  <div className="bg-muted/50 p-3 rounded">
                                    <p className="font-medium">
                                      {product.farmer.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {product.farmer.email}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {product.farmer.phone}
                                    </p>
                                  </div>
                                </div>
                                {product.photos &&
                                  product.photos.length > 1 && (
                                    <div>
                                      <h4 className="font-medium mb-2">
                                        Product Images
                                      </h4>
                                      <div className="grid grid-cols-4 gap-2">
                                        {product.photos
                                          .slice(1)
                                          .map((photo, index) => (
                                            <div
                                              key={index}
                                              className="aspect-square relative rounded overflow-hidden"
                                            >
                                              <Image
                                                src={photo}
                                                alt={`${product.title} ${
                                                  index + 2
                                                }`}
                                                fill
                                                className="object-cover"
                                              />
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setNewStatus(product.is_active);
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
            <DialogTitle>Update Product Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={newStatus.toString()}
                onValueChange={(value) => setNewStatus(value === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                placeholder="Add reason for status change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
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
