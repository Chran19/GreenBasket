"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import farmerAnim from "@/public/animations/farmer.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#e8f9ee] to-[#d7f4e3] py-20 md:py-28">
      {/* Decorative Waves */}
      <div className="absolute top-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none">
          <path
            fill="#d2efdd"
            d="M0 0h1440v27.56S1125 94.51 720 98.39C315 102.26 0 40.16 0 40.16V0Z"
          />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 right-0 rotate-180">
        <svg viewBox="0 0 1440 120" fill="none">
          <path
            fill="#d2efdd"
            d="M0 0h1440v27.56S1125 94.51 720 98.39C315 102.26 0 40.16 0 40.16V0Z"
          />
        </svg>
      </div>

      <div className="container relative mx-auto px-4 grid grid-cols-1 md:grid-cols-2 items-center gap-16">
        {/* Text */}
        <div>
          <h1 className="text-5xl md:text-6xl font-bold text-green-900 leading-tight mb-6 tracking-tight">
            Fresh from Farm
            <span className="block text-green-700">to Your Table</span>
          </h1>
          <p className="text-lg md:text-xl text-green-800 mb-8 max-w-xl">
            Discover fresh produce delivered straight from trusted farmers. Eat
            natural. Live healthy. Support sustainability.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              asChild
              className="bg-green-700 hover:bg-green-800 shadow-lg shadow-green-900/20 px-8"
            >
              <Link href="/products">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-green-700 text-green-800 hover:bg-green-100 px-8"
            >
              <Link href="/farmers">Meet Our Farmers</Link>
            </Button>
          </div>
        </div>

        {/* Animation */}
        <div className="relative flex justify-center">
          <div className="absolute w-72 h-72 bg-green-300 rounded-full blur-3xl opacity-20 -z-10"></div>
          <Lottie
            animationData={farmerAnim}
            loop
            className="w-[500px] h-[420px] drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
