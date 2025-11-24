"use client";

import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/product/product-card";
import { productsAPI } from "@/lib/api";
import { useEffect, useState } from "react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res: any = await productsAPI.getAll({ search: query });
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
        setResults(normalized);
      } finally {
        setLoading(false);
      }
    };
    if (query) load();
    else setResults([]);
  }, [query]);

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Search Summary Card */}
        <div
          className="rounded-3xl p-6 mt-6"
          style={{
            backgroundImage: "url('/images/Products-bg.jpg')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          {/* Search Summary Card */}
          <div className="bg-white/80 backdrop-blur-md border rounded-2xl shadow-sm p-6">
            <h1 className="text-2xl font-semibold text-[#166534]">
              Search Results
            </h1>

            <p className="text-sm text-gray-600 mt-1">
              {loading
                ? "Searching..."
                : results.length > 0
                ? `${results.length} products found for "${query}"`
                : `No results found for "${query}"`}
            </p>

            <div className="border-t border-gray-200 my-4"></div>

            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs bg-[#d1f5e0] text-[#166534] px-3 py-1 rounded-full font-medium">
                Organic
              </span>
              <span className="text-xs bg-[#d1f5e0] text-[#166534] px-3 py-1 rounded-full font-medium">
                Fresh
              </span>
              <span className="text-xs bg-[#d1f5e0] text-[#166534] px-3 py-1 rounded-full font-medium">
                Locally Sourced
              </span>
            </div>
          </div>
        </div>

        <div
          className="rounded-3xl p-6 mt-6"
          style={{
            backgroundImage: "url('/images/Products-bg.jpg')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          {results.length > 0 ? (
            <>
              {/* Results Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mb-10">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Browse All Products Button */}
              <div className="flex justify-center mb-14">
                <a
                  href="/products"
                  className="px-6 py-3 border border-[#166534] text-[#166534] rounded-xl font-medium hover:bg-[#166534] hover:text-white transition"
                >
                  Browse All Products
                </a>
              </div>

              {/* Recommended Section */}
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-4">
                  Other Products You May Like
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {results
                    .slice(0, 5)
                    .reverse()
                    .map((product) => (
                      <ProductCard
                        key={`rec-${product.id}`}
                        product={product}
                      />
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 py-24 bg-white/10 backdrop-blur-md rounded-3xl shadow-sm px-8">
              {/* LEFT TEXT AREA */}
              <div className="max-w-md text-center md:text-left">
                <h2 className="text-4xl font-extrabold text-[#166534] leading-tight mb-4">
                  Couldn't find anything for "{query}"
                </h2>

                <p className="text-gray-600 text-lg mb-6">
                  We searched our entire fresh produce catalog but couldn't
                  match your query. Try browsing categories or check trending
                  products.
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
                  {[
                    "Organic",
                    "Fresh Vegetables",
                    "Fruits",
                    "Dairy",
                    "Grains",
                  ].map((item) => (
                    <a
                      key={item}
                      href={`/products?tag=${item}`}
                      className="px-4 py-2 bg-[#e6f7ea] text-[#166534] text-sm rounded-full border border-[#b6e5c4] hover:bg-[#d6f1df] transition"
                    >
                      {item}
                    </a>
                  ))}
                </div>

                <a
                  href="/products"
                  className="px-8 py-3 bg-[#166534] text-white text-lg font-semibold rounded-xl shadow hover:bg-[#0f3f28] transition"
                >
                  Browse All Products
                </a>
              </div>

              {/* RIGHT IMAGE */}
              <div className="max-w-lg w-full">
                <div
                  className="w-full aspect-square bg-no-repeat bg-contain bg-center"
                  style={{ backgroundImage: "url('/images/empty-search.jpg')" }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
