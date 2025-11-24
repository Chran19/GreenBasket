"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, AlertTriangle, TrendingUp, Search, Plus, Edit, Trash2 } from "lucide-react"

import { farmerAPI } from "@/lib/api"

interface InventoryItem {
  id: string
  name: string
  category: string
  currentStock: number
  unit: string
  lastUpdated?: string
  status: "in-stock" | "low-stock" | "out-of-stock"
}

export function InventoryOverview() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    const load = async () => {
      const res: any = await farmerAPI.getMyProducts({ limit: 100 })
      const items = res?.data || res?.data?.data || []
      const normalized: InventoryItem[] = items.map((p: any) => ({
        id: p.id,
        name: p.title,
        category: p.category,
        currentStock: p.stock ?? 0,
        unit: p.unit || "",
        lastUpdated: p.updated_at,
        status: (p.stock ?? 0) === 0 ? "out-of-stock" : (p.stock ?? 0) <= 10 ? "low-stock" : "in-stock",
      }))
      setInventory(normalized)
    }
    load()
  }, [])

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || item.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const lowStockItems = inventory.filter((item) => item.status === "low-stock" || item.status === "out-of-stock")
  const totalItems = inventory.length
  const inStockItems = inventory.filter((item) => item.status === "in-stock").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "default"
      case "low-stock":
        return "secondary"
      case "out-of-stock":
        return "destructive"
      default:
        return "default"
    }
  }

  const updateStock = async (id: string, newStock: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let status: "in-stock" | "low-stock" | "out-of-stock" = "in-stock"
          if (newStock === 0) status = "out-of-stock"
          else if (newStock <= 10) status = "low-stock"

          return {
            ...item,
            currentStock: newStock,
            status,
            lastUpdated: new Date().toISOString().split("T")[0],
          }
        }
        return item
      }),
    )
    try {
      await farmerAPI.updateStock(id, newStock)
    } catch (e) {
      console.error('Failed to update stock', e)
    }
  }

  return (
    <div className="space-y-6">
      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inStockItems}</p>
                <p className="text-sm text-muted-foreground">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
                <p className="text-sm text-muted-foreground">Low/Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <Package className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round((inStockItems / totalItems) * 100)}%</p>
                <p className="text-sm text-muted-foreground">Stock Health</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {lowStockItems.length} product(s) that need attention:{" "}
            {lowStockItems.map((item) => item.name).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventory Management</CardTitle>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "in-stock" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("in-stock")}
              >
                In Stock
              </Button>
              <Button
                variant={filterStatus === "low-stock" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("low-stock")}
              >
                Low Stock
              </Button>
              <Button
                variant={filterStatus === "out-of-stock" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("out-of-stock")}
              >
                Out of Stock
              </Button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="space-y-4">
            {filteredInventory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                    <p className="text-xs text-muted-foreground">Updated: {item.lastUpdated}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-medium">
                      {item.currentStock} {item.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">&nbsp;</p>
                  </div>

                  <Badge variant={getStatusColor(item.status)}>{item.status.replace("-", " ").toUpperCase()}</Badge>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={item.currentStock}
                      onChange={(e) => updateStock(item.id, Number.parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
