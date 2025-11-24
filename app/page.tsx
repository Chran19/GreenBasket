"use client"
import { Header } from "@/components/layout/header"
import { HeroSection } from "@/components/home/hero-section"
import { CategoriesSection } from "@/components/home/categories-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { TrendingDeals } from "@/components/home/trending-deals"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <CategoriesSection />
        <FeaturedProducts />
        <TrendingDeals />
      </main>
    </div>
  )
}
