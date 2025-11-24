"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { RazorpayCheckout } from "@/components/payment/razorpay-checkout";
import { useCart } from "@/hooks/use-cart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentIdParam = searchParams.get("payment_id"); // For success page
  const productId = searchParams.get("productId");

  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentId, setPaymentId] = useState("");

  const {
    items,
    fetchCart,
    appliedDiscount,
    getDiscountAmount,
    applyDiscount,
  } = useCart();

  const promoParam = searchParams.get("promo");

  useEffect(() => {
    fetchCart();
    if (promoParam && !appliedDiscount) {
      if (promoParam === "FRESH10") {
        applyDiscount("FRESH10");
      }
    }
  }, [fetchCart, promoParam, appliedDiscount, applyDiscount]);

  // Detect payment success via URL param
  useEffect(() => {
    if (paymentIdParam) {
      setPaymentId(paymentIdParam);
      setPaymentComplete(true);
    }
  }, [paymentIdParam]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = getDiscountAmount();
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal - discount + shipping;

  const handlePaymentSuccess = async (id: string) => {
    try {
      setPaymentId(id);

      const rawData = localStorage.getItem("checkout_shipping");
      const data = rawData ? JSON.parse(rawData) : {};

      const selectedItems = productId
        ? items.filter((i) => i.id === productId)
        : items;

      const subtotalSelected = selectedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const discountSelected = appliedDiscount ? getDiscountAmount() : 0;
      const shippingSelected = subtotalSelected > 50 ? 0 : 5.99;
      const totalSelected =
        subtotalSelected - discountSelected + shippingSelected;

      const buyer_id = "0892f843-c975-4113-88e7-cf56b3a1513d";
      const farmer_id = "aea905a7-226c-45ce-ac2e-019c82d7414b";

      const delivery_address =
        (document.getElementById("address") as HTMLInputElement)?.value ||
        "N/A";
      const notes =
        (document.getElementById("notes") as HTMLTextAreaElement)?.value ||
        null;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            buyer_id,
            farmer_id,
            total_price: totalSelected,
            delivery_address,
            razorpay_payment_id: id,
            notes,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;
      const orderId = order.id;

      const orderItems = selectedItems.map((item) => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        price_per_unit: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemError) throw itemError;

      if (productId) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("buyer_id", buyer_id)
          .eq("product_id", productId);
      } else {
        await supabase.from("cart_items").delete().eq("buyer_id", buyer_id);
      }

      // 🔥 Send invoice via backend route
      const userEmail = (document.getElementById("email") as HTMLInputElement)
        ?.value;

      const payload = {
        email: (document.getElementById("email") as HTMLInputElement).value,
        orderId,
        total: totalSelected,
        shipping: {
          firstName: (document.getElementById("firstName") as HTMLInputElement)
            .value,
          lastName: (document.getElementById("lastName") as HTMLInputElement)
            .value,
          phone: (document.getElementById("phone") as HTMLInputElement).value,
          address: (document.getElementById("address") as HTMLInputElement)
            .value,
          city: (document.getElementById("city") as HTMLInputElement).value,
          zipCode: (document.getElementById("zipCode") as HTMLInputElement)
            .value,
          notes: (document.getElementById("notes") as HTMLTextAreaElement)
            .value,
        },
      };

      console.log("🚀 Payload sending to API:", payload);

      await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setPaymentComplete(true);
    } catch (err: any) {
      console.error("Order creation failed:", err?.message || err);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Thank you for your order. Your fresh produce will be delivered
                soon.
              </p>
            </div>

            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Payment ID</p>
                  <p className="font-mono text-sm bg-muted p-2 rounded">
                    {paymentId}
                  </p>
                  <p className="text-sm text-muted-foreground">Order Total</p>
                  <p className="text-2xl font-bold">₹{total.toFixed(2)}</p>
                  {appliedDiscount && (
                    <div className="mt-2 text-sm text-green-600">
                      Promo code {appliedDiscount.code} applied: -₹
                      {discount.toFixed(2)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button onClick={() => router.push("/buyer")} className="w-full">
                View Order Status
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full bg-transparent"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal checkout UI
  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cart
        </Button>
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="(555) 123-4567" />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Main Street" />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Anytown" />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input id="zipCode" placeholder="12345" />
                </div>

                <div>
                  <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Special delivery instructions..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment */}
          <div>
            <RazorpayCheckout
              items={
                productId ? items.filter((i) => i.id === productId) : items
              }
              subtotal={
                productId
                  ? items
                      .filter((i) => i.id === productId)
                      .reduce((sum, i) => sum + i.price * i.quantity, 0)
                  : subtotal
              }
              shipping={
                productId
                  ? items
                      .filter((i) => i.id === productId)
                      .reduce((sum, i) => sum + i.price * i.quantity, 0) > 50
                    ? 0
                    : 5.99
                  : shipping
              }
              discount={
                productId
                  ? appliedDiscount
                    ? getDiscountAmount()
                    : 0
                  : discount
              }
              total={
                productId
                  ? (() => {
                      const s = items
                        .filter((i) => i.id === productId)
                        .reduce((sum, i) => sum + i.price * i.quantity, 0);
                      const d = appliedDiscount ? getDiscountAmount() : 0;
                      return s - d + (s > 50 ? 0 : 5.99);
                    })()
                  : total
              }
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              showPaymentOptions={true}
            />

            <Button
              className="w-full mt-4"
              onClick={() => {
                const data = {
                  firstName: (
                    document.getElementById("firstName") as HTMLInputElement
                  )?.value,
                  lastName: (
                    document.getElementById("lastName") as HTMLInputElement
                  )?.value,
                  email: (document.getElementById("email") as HTMLInputElement)
                    ?.value,
                  phone: (document.getElementById("phone") as HTMLInputElement)
                    ?.value,
                  address: (
                    document.getElementById("address") as HTMLInputElement
                  )?.value,
                  city: (document.getElementById("city") as HTMLInputElement)
                    ?.value,
                  zipCode: (
                    document.getElementById("zipCode") as HTMLInputElement
                  )?.value,
                  notes: (
                    document.getElementById("notes") as HTMLTextAreaElement
                  )?.value,
                };

                localStorage.setItem("checkout_shipping", JSON.stringify(data));

                router.push(
                  productId
                    ? `/checkout/payment?productId=${productId}`
                    : `/checkout/payment`
                );
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
