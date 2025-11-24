"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { productsAPI } from "@/lib/api";

export function CategoriesSection() {
  const [cats, setCats] = useState<
    { id: string; name: string; image?: string; productCount?: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await productsAPI.getAll({ limit: 100 });
        const items = res?.data || res?.data?.data || [];

        const map = new Map<
          string,
          { id: string; name: string; count: number; image?: string }
        >();

        for (const p of items) {
          const key = p.category || "general";
          map.set(key, {
            id: encodeURIComponent(key),
            name: key,
            count: (map.get(key)?.count || 0) + 1,
            image: map.get(key)?.image || p.photos?.[0] || "/placeholder.png",
          });
        }

        setCats(Array.from(map.values()));
      } catch (err: any) {
        setError(err?.message || "Failed to load categories");
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-[#e9fff0] to-[#d7f8df]">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-green-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-green-700 max-w-xl mx-auto">
            Pick your favourite category and enjoy farm-fresh products delivered
            to you.
          </p>
        </div>

        {/* Error */}
        {error && <div className="text-center text-red-500 mb-4">{error}</div>}

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {!loaded &&
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl bg-green-200/30" />
            ))}

          {loaded && cats.length === 0 && (
            <p className="col-span-full text-center text-green-700">
              No categories available.
            </p>
          )}

          {cats.map((category, i) => (
            <Link key={category.id} href={`/category/${category.id}`}>
              <Card
                className="group h-full hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-xl border border-green-200 bg-white"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <CardContent className="p-4 text-center">
                  <div className="aspect-square relative mb-4 overflow-hidden rounded-xl">
                    <Image
                      src={category.image || "/placeholder.png"}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-green-900 mb-1 capitalize">
                    {category.name}
                  </h3>
                  <p className="text-sm text-green-700">
                    {category.count} products
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="text-green-800 font-semibold hover:underline text-lg"
          >
            View All Products →
          </Link>
        </div>
      </div>
    </section>
  );
}
