"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { productsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function FeaturedProducts() {
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
      .catch((err) =>
        setError(err?.message || "Failed to load featured products")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-[#c7ecd7] to-[#e9fff0]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-green-900 mb-3">
            Featured Products
          </h2>
          <p className="text-lg text-green-700 max-w-2xl mx-auto">
            Freshly harvested and hand-selected by our community of trusted
            farmers
          </p>
        </div>

        {error && <div className="text-red-600 text-center mb-4">{error}</div>}

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

        <div className="flex justify-center mt-14">
          <Button
            className="px-10 bg-green-700 hover:bg-green-800 shadow-md"
            size="lg"
            asChild
          >
            <a href="/products">View All Products</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
