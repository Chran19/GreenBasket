"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <footer className="bg-gradient-to-b from-[#f0fff4] to-[#dbf7df] border-t mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg text-green-900 mb-4">
              Green Basket
            </h3>
            <p className="text-sm text-green-700 mb-4">
              Connecting local farmers with conscious consumers for fresh,
              sustainable produce.
            </p>
            <p className="text-sm text-green-700">
              Fresh from farm to your table.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-green-900 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                ["All Products", "/products"],
                ["Our Farmers", "/farmers"],
                ["Subscriptions", "/subscription"],
                ["About Us", "/about"],
              ].map(([name, link]) => (
                <li key={link}>
                  <Link
                    href={link}
                    className="text-green-700 hover:text-green-900 transition"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-green-900 mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              {[
                ["Vegetables", "/category/vegetables"],
                ["Fruits", "/category/fruits"],
                ["Dairy", "/category/dairy"],
                ["Organic", "/category/organic"],
              ].map(([name, link]) => (
                <li key={link}>
                  <Link
                    href={link}
                    className="text-green-700 hover:text-green-900 transition"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-green-900 mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              {[
                ["Help Center", "/help"],
                ["Contact Us", "/contact"],
                ["Shipping Info", "/shipping"],
                ["Returns", "/returns"],
              ].map(([name, link]) => (
                <li key={link}>
                  <Link
                    href={link}
                    className="text-green-700 hover:text-green-900 transition"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-green-300" />

        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-green-700">
          <p>&copy; 2025 Green Basket. All rights reserved.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <Link href="/privacy" className="hover:text-green-900 transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-green-900 transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
