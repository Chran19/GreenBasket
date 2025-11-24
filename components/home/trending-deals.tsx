"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { productsAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

export function TrendingDeals() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsAPI
      .getAll({ sortBy: "created_at", sortOrder: "desc", limit: 8 })
      .then((res: any) => {
        const data = res?.data || res?.data?.data || [];
        setItems(
          data.map((p: any) => ({
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
          }))
        );
      })
      .catch((err) => setError(err?.message || "Failed to load trending deals"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative py-20 bg-gradient-to-b from-[#d7f4e3] to-[#c7ecd7]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-green-700" />
            <Badge className="text-sm bg-green-200 text-green-800">
              Hot Picks
            </Badge>
          </div>
          <h2 className="text-4xl font-bold text-green-900 mb-3">
            Trending Deals
          </h2>
          <p className="text-lg text-green-700 max-w-2xl mx-auto">
            Most popular products customers are loving this week
          </p>
        </div>

        {error && <div className="text-red-600 text-center mb-3">{error}</div>}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-7">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[270px] bg-green-200/40 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-7">
            {items.map((product) => (
              <div
                key={product.id}
                className="scale-[0.92] hover:scale-[0.97] transition-all drop-shadow-sm"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
