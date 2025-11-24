"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/header";
import { ProductFilters } from "@/components/buyer/product-filters";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productsAPI } from "@/lib/api";
import { Grid, List } from "lucide-react";

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  farmers: string[];
  rating: number;
  inStock: boolean;
}

export default function ProductsPage() {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 50],
    farmers: [],
    rating: 0,
    inStock: false,
  });

  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Build server-side filters to reduce data transfer
        const serverFilters: any = {};
        if (filters.categories.length === 1)
          serverFilters.category = filters.categories[0];
        if (filters.inStock) serverFilters.inStock = true;
        if (filters.priceRange) {
          serverFilters.minPrice = filters.priceRange[0];
          serverFilters.maxPrice = filters.priceRange[1];
        }
        const res: any = await productsAPI.getAll(serverFilters);
        const items = res?.data || res?.data?.data || res?.products || [];
        const normalized = items.map((p: any) => ({
          id: p.id,
          name: p.title ?? p.name ?? "",
          price: Number(p.price ?? 0),
          unit: p.unit,
          image: p.photos?.[0] || "/placeholder.png",
          originalPrice: undefined,
          inStock: (p.stock ?? 0) > 0,
          farmer: p.farmer?.name,
          rating: p.averageRating ?? 4,
          reviewCount: p.reviewCount ?? 0,
          category: p.category,
        }));
        setAllProducts(normalized);
      } catch (e) {
        console.error("Failed to load products", e);
      }
    };
    load();
  }, [filters.categories, filters.inStock, filters.priceRange]);

  const filteredProducts = useMemo(() => {
    const filtered = allProducts.filter((product) => {
      // Category filter
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(product.category)
      ) {
        return false;
      }

      // Price filter
      if (
        product.price < filters.priceRange[0] ||
        product.price > filters.priceRange[1]
      ) {
        return false;
      }

      // Farmer filter
      if (
        filters.farmers.length > 0 &&
        !filters.farmers.includes(product.farmer)
      ) {
        return false;
      }

      // Rating filter
      if (filters.rating > 0 && product.rating < filters.rating) {
        return false;
      }

      // Stock filter
      if (filters.inStock && !product.inStock) {
        return false;
      }

      return true;
    });

    // Sort products
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Keep original order for relevance
        break;
    }

    return filtered;
  }, [filters, sortBy]);

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 50],
      farmers: [],
      rating: 0,
      inStock: false,
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/images/main-page-bg.jpg')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <ProductFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Main Content */}
          {/* Main Content */}
          <div
            className="flex-1 rounded-3xl p-6"
            style={{
              backgroundImage: "url('/images/Products-bg.jpg')",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold">All Products</h1>
                <p className="text-muted-foreground">
                  {filteredProducts.length} products found
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent
                    className="border-none shadow-lg bg-white/60 backdrop-blur-md"
                    style={{
                      backgroundImage: "url('/images/main-page-bg.jpg')",
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                    }}
                  >
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="rating">Customer Rating</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No products found matching your filters.
                </p>
                <Button onClick={clearFilters}>Clear all filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
