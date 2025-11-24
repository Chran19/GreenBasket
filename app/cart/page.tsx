"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { CartItemComponent } from "@/components/buyer/cart-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, CreditCard, Truck } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    fetchCart,
    appliedDiscount,
    applyDiscount,
    removeDiscount,
    getDiscountAmount,
  } = useCart();
  const [promoCode, setPromoCode] = useState("");

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === "fresh10") {
      applyDiscount("FRESH10");
      setPromoCode("");
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = getDiscountAmount();
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal - discount + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Add some fresh products to get started!
            </p>
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-green-900">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#d3ecd9] rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <CartItemComponent
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
                <Link href={`/checkout?productId=${item.id}`}>Buy Now</Link>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6 sticky top-24">
            <Card className="border border-[#bde6c8] shadow-lg shadow-green-900/10">
              <CardHeader className="bg-[#e8f9ee] rounded-t-xl">
                <CardTitle className="text-green-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-green-900">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Discount ({appliedDiscount.code})</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="text-sm bg-green-100 text-green-700 py-2 px-3 rounded-md">
                    You saved <strong>₹{discount.toFixed(2)}</strong> 🎉
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}
                  </span>
                </div>

                {shipping === 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Truck className="h-4 w-4" />
                    Free shipping on orders over ₹50!
                  </div>
                )}

                <Separator />

                <div className="flex justify-between font-bold text-xl text-green-900">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Promo Code */}
            <Card className="border border-[#ceeeda]">
              <CardContent className="p-4 space-y-3">
                <label className="text-sm font-medium text-green-900">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="border border-[#a6dcb4]"
                  />
                  <Button
                    className="bg-green-700 hover:bg-green-800"
                    onClick={applyPromoCode}
                  >
                    Apply
                  </Button>
                </div>

                {appliedDiscount && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600 text-white">
                      {appliedDiscount.code} applied
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeDiscount}
                      className="h-6 px-2 text-xs text-red-700 hover:text-red-800"
                    >
                      Remove
                    </Button>
                  </div>
                )}

                <p className="text-xs text-green-800">
                  Try code "FRESH10" for 10% off
                </p>
              </CardContent>
            </Card>

            {/* Checkout Buttons */}
            <Button
              className="w-full bg-green-700 hover:bg-green-800 shadow-md shadow-green-900/20"
              size="lg"
              asChild
            >
              <Link href="/checkout">
                <CreditCard className="h-5 w-5 mr-2" /> Proceed to Checkout
              </Link>
            </Button>

            <Button
              variant="outline"
              className="w-full hover:bg-green-200"
              asChild
            >
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
