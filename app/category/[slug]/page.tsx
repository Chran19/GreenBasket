"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/buyer/product-filters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productsAPI } from "@/lib/api";

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  farmers: string[];
  rating: number;
  inStock: boolean;
}

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.slug as string;

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 50],
    farmers: [],
    rating: 0,
    inStock: false,
  });

  const [categoryName, setCategoryName] = useState<string>(categorySlug);
  const [backendProducts, setBackendProducts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await productsAPI.getAll({ category: categorySlug });
        const items = res?.data || res?.data?.data || [];
        const normalized = items.map((p: any) => ({
          id: p.id,
          name: p.title ?? p.name ?? "",
          price: Number(p.price ?? 0),
          unit: p.unit,
          image: p.photos?.[0] || "/placeholder.png",
          inStock: (p.stock ?? 0) > 0,
          farmer: p.farmer?.name,
          rating: p.averageRating ?? 4,
          reviewCount: p.reviewCount ?? 0,
          category: p.category,
        }));
        setBackendProducts(normalized);
        if (items?.[0]?.category) setCategoryName(items[0].category);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [categorySlug]);

  const filteredProducts = useMemo(() => {
    let products = backendProducts;

    if (filters.categories.length > 0) {
      products = products.filter((product) =>
        filters.categories.some(
          (cat) =>
            product.category?.toLowerCase().replace(/[^a-z0-9]/g, "") ===
            cat.toLowerCase().replace(/[^a-z0-9]/g, "")
        )
      );
    }

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50) {
      products = products.filter(
        (product) =>
          product.price >= filters.priceRange[0] &&
          product.price <= filters.priceRange[1]
      );
    }

    if (filters.farmers.length > 0) {
      products = products.filter((product) =>
        filters.farmers.includes(product.farmer)
      );
    }

    if (filters.rating > 0) {
      products = products.filter((product) => product.rating >= filters.rating);
    }

    if (filters.inStock) {
      products = products.filter((product) => product.inStock);
    }

    return products;
  }, [backendProducts, categorySlug, filters]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 50],
      farmers: [],
      rating: 0,
      inStock: false,
    });
  };

  if (!categoryName) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Category not found</h1>
            <p className="text-muted-foreground">
              The category you're looking for doesn't exist.
            </p>
            <Button className="mt-4" asChild>
              <a href="/products">Browse All Products</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <a href="/" className="hover:text-foreground">
            Home
          </a>
          <span>/</span>
          <a href="/products" className="hover:text-foreground">
            Products
          </a>
          <span>/</span>
          <span className="text-foreground">{categoryName}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{categoryName}</h1>
          <p className="text-muted-foreground">
            Fresh {categoryName.toLowerCase()} from local farmers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <ProductFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          <div
            className="lg:col-span-3 rounded-3xl p-6"
            style={{
              backgroundImage: "url('/images/Products-bg.jpg')",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">
                  Showing {filteredProducts.length} product
                  {filteredProducts.length !== 1 ? "s" : ""}
                </p>
                {filteredProducts.length > 0 && (
                  <Badge variant="secondary">{categoryName}</Badge>
                )}
              </div>
              <Button variant="outline" size="sm">
                Sort by: Featured
              </Button>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-semibold mb-2">
                    No products found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    We don't have any products in this category right now. Check
                    back soon or browse other categories.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button asChild>
                      <a href="/products">Browse All Products</a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/">Back to Home</a>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
