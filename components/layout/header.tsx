"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ShoppingCart, User, Menu, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useRouter } from "next/navigation";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated, logout } = useAuth();
  const { getTotalItems } = useCart();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const cartItemCount = getTotalItems();

  const categories = [
    {
      label: "Vegetables",
      href: "/category/vegetables",
      icon: "/icons/fresh-vegetables.png",
    },
    {
      label: "Fruits",
      href: "/category/fruits",
      icon: "/icons/organic-apples.png",
    },
    {
      label: "Grains",
      href: "/category/grains",
      icon: "/icons/grains-cereals.png",
    },
    { label: "Dairy", href: "/category/dairy", icon: "/icons/milk.png" },
    {
      label: "Herbs",
      href: "/category/herbs",
      icon: "/icons/herbs-and-spices.png",
    },
    {
      label: "Organic",
      href: "/category/organic",
      icon: "/icons/organic-produce-display.jpg",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-br from-[#e8f9ee] to-[#d7f4e3] backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top message */}
      <div className="bg-[#166534] text-white text-sm text-center py-1 font-medium">
        Free delivery on orders over ₹50 • Fresh from local farms
      </div>

      {/* Logo + Search + Icons */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between w-full gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Green Basket Logo"
              className="h-9 w-9 rounded-md object-contain"
            />
            <span className="font-extrabold text-2xl text-[#064e3b] hidden sm:block">
              Green Basket
            </span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 min-w-0">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search for fresh produce, dairy, grains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 h-11 rounded-xl border-[#a3d9b2] focus:border-[#166534]"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-0 top-0 h-11 px-3 rounded-xl bg-[#166534] hover:bg-[#064e3b] flex items-center justify-center"
              >
                <Search className="h-4 w-4 text-white" />
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/cart">
              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-[#d8f5e5] rounded-lg"
              >
                <ShoppingCart className="h-5 w-5 text-[#064e3b]" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-[#166534] text-white h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 hover:bg-[#d8f5e5] rounded-lg"
                  >
                    <User className="h-5 w-5 text-[#064e3b]" />
                    <span className="hidden md:block">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-lg shadow-lg"
                >
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {(user?.role === "buyer" || user?.role === "farmer") && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={
                          user?.role === "buyer"
                            ? "/buyer/messages"
                            : "/farmer/messages"
                        }
                        className="flex items-center"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" /> Messages
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>Orders</DropdownMenuItem>
                  <DropdownMenuItem>Wishlist</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {user?.role === "buyer" && (
                    <DropdownMenuItem onClick={() => router.push("/buyer")}>
                      Buyer Dashboard
                    </DropdownMenuItem>
                  )}
                  {user?.role === "farmer" && (
                    <DropdownMenuItem onClick={() => router.push("/farmer")}>
                      Farmer Dashboard
                    </DropdownMenuItem>
                  )}
                  {user?.role === "admin" && (
                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hover:bg-[#d8f5e5] rounded-lg"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-[#166534] hover:bg-[#064e3b] rounded-lg"
                >
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden hover:bg-[#d8f5e5] rounded-lg"
            >
              <Menu className="h-5 w-5 text-[#064e3b]" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category buttons */}
      <div className="border-t bg-[#e8f9ee]">
        <div className="container mx-auto px-4 py-1">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#b2e2c2] bg-white text-[#166534] text-xs font-medium transition-all duration-300 shadow-sm
          hover:bg-[#166534] hover:text-white hover:-translate-y-[2px] hover:shadow-lg hover:shadow-[#064e3b]/25 active:scale-[0.97]"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-[#e8f9ee] border border-[#b2e2c2] flex-shrink-0">
                  <img
                    src={cat.icon}
                    alt={cat.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
