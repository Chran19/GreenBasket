"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo } from "react";
import { RegisterForm } from "@/components/auth/register-form";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

// animations & images
import farmerAnim from "@/public/animations/farmer.json";

export default function RegisterPage() {
  const assets = useMemo(
    () => [
      { type: "lottie", src: farmerAnim },
      { type: "image", src: "/farmer.png" },
      { type: "image", src: "/login-illustration.jpg" },
    ],
    []
  );

  const selected = useMemo(
    () => assets[Math.floor(Math.random() * assets.length)],
    [assets]
  );

  return (
    <div className="relative min-h-screen flex bg-white overflow-hidden">
      {/* Floating background blobs */}
      <div className="absolute -top-32 -left-24 w-[380px] h-[380px] bg-green-200 rounded-full blur-3xl opacity-60 animate-pulse" />
      <div className="absolute bottom-0 -right-32 w-[420px] h-[420px] bg-green-300 rounded-full blur-3xl opacity-50 animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute top-1/2 left-1/2 w-[260px] h-[260px] bg-green-100 rounded-full blur-3xl opacity-40 animate-[spin_35s_linear_infinite]" />

      {/* Left Section */}
      <div className="relative w-full md:w-1/2 flex flex-col justify-center px-8 md:px-20">
        <h1 className="text-5xl font-extrabold text-green-700 drop-shadow-sm">
          Green Basket
        </h1>
        <p className="text-gray-600 mt-3 mb-10 text-base">
          Join the marketplace that brings farms directly to homes.
        </p>

        <div className="backdrop-blur-xl shadow-xl border border-white/20 bg-white/40 rounded-3xl p-10">
          <RegisterForm />
        </div>

        <p className="text-center text-sm mt-6 text-gray-700">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-green-700 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Right — random animation/image */}
      <div className="hidden md:flex justify-center items-center w-1/2">
        {selected.type === "lottie" ? (
          <Lottie
            animationData={selected.src}
            loop
            style={{ width: 520, height: 520 }}
          />
        ) : (
          <Image
            src={selected.src}
            alt="register visual"
            width={520}
            height={520}
          />
        )}
      </div>
    </div>
  );
}
