"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RazorpayCheckout } from "@/components/payment/razorpay-checkout";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
async function createOrder({
  buyer_id,
  farmer_id,
  items,
  total,
  address,
  notes,
  payment_id,
}: {
  buyer_id: string;
  farmer_id: string;
  items: any[];
  total: number;
  address: string;
  notes?: string | null;
  payment_id: string;
}) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        buyer_id,
        farmer_id,
        total_price: total,
        delivery_address: address,
        razorpay_payment_id: payment_id,
        notes,
      },
    ])
    .select()
    .single();
  if (orderError) throw orderError;

  const orderId = order.id;

  const orderItems = items.map((item) => ({
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

  if (items.length === 1) {
    await supabase
      .from("cart_items")
      .delete()
      .eq("buyer_id", buyer_id)
      .eq("product_id", items[0].id);
  } else {
    await supabase.from("cart_items").delete().eq("buyer_id", buyer_id);
  }

  return orderId;
}
export default function PaymentMethodPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("productId");
  const { items, appliedDiscount, getDiscountAmount } = useCart();

  const [shippingInfo, setShippingInfo] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("checkout_shipping");
    if (stored) setShippingInfo(JSON.parse(stored));
  }, []);

  const selectedItems = productId
    ? items.filter((i) => i.id === productId)
    : items;

  const subtotal = selectedItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const discount = appliedDiscount ? getDiscountAmount() : 0;
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal - discount + shipping;

  const buyerId = "0892f843-c975-4113-88e7-cf56b3a1513d";
  const farmerId = "aea905a7-226c-45ce-ac2e-019c82d7414b";

  return (
    <div className="min-h-screen container mx-auto py-10">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        Back
      </Button>

      <h1 className="text-3xl font-bold mb-8">Secure Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT SIDE: DELIVERY INFO */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {shippingInfo ? (
                <>
                  <p className="font-semibold">
                    {shippingInfo.firstName} {shippingInfo.lastName}
                  </p>
                  <p>{shippingInfo.address}</p>
                  <p>
                    {shippingInfo.city} - {shippingInfo.zipCode}
                  </p>
                  <p>{shippingInfo.phone}</p>
                  <p>{shippingInfo.email}</p>
                  {shippingInfo.notes && (
                    <p className="text-muted-foreground">
                      Notes: {shippingInfo.notes}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Delivery information missing — return to checkout to fill it.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE: ORDER SUMMARY + PAYMENT */}
        <RazorpayCheckout
          items={selectedItems}
          subtotal={subtotal}
          shipping={shipping}
          discount={discount}
          total={total}
          onPaymentSuccess={async (paymentId) => {
            try {
              await createOrder({
                buyer_id: buyerId,
                farmer_id: farmerId,
                items: selectedItems,
                total,
                address: shippingInfo?.address || "N/A",
                notes: shippingInfo?.notes || null,
                payment_id: paymentId,
              });
              router.push(`/checkout?payment_id=${paymentId}`);
            } catch (err) {
              console.error("Payment/order creation failed:", err);
            }
          }}
          onPaymentError={(err) => console.error(err)}
          showPaymentOptions={true}
        />
      </div>
    </div>
  );
}
