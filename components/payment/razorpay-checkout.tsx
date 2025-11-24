"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  farmer: string;
}

interface RazorpayCheckoutProps {
  items: CheckoutItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  showPaymentOptions?: boolean;
}

export function RazorpayCheckout({
  items,
  subtotal,
  shipping,
  discount = 0,
  total,
  onPaymentSuccess,
  onPaymentError,
  showPaymentOptions = true,
}: RazorpayCheckoutProps) {
  const { appliedDiscount } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");

  const handlePayment = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Mock payment success after delay
    setTimeout(() => {
      const mockPaymentId = `pay_${Date.now()}`;
      onPaymentSuccess(mockPaymentId);
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Secure Checkout</CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Order Summary */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Order Summary</h3>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.farmer} × {item.quantity}
                </p>
              </div>
              <p className="font-medium">
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <Separator />

        {/* Pricing Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && appliedDiscount && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({appliedDiscount.code})</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <Separator />
        {showPaymentOptions && (
          <>
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Select Payment Method</h3>

              {[
                { id: "upi", label: "UPI" },
                { id: "card", label: "Credit / Debit Card" },
                { id: "saved", label: "Saved Cards" },
                { id: "cod", label: "Cash on Delivery (COD)" },
              ].map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={option.id}
                    name="payment"
                    value={option.id}
                    checked={paymentMethod === option.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={option.id} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>

            {/* Dynamic Payment Fields */}
            {paymentMethod === "upi" && (
              <div className="space-y-2 p-4 border rounded-lg">
                <Label>Enter your UPI ID</Label>
                <Input placeholder="example@upi" />
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry</Label>
                    <Input placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input placeholder="***" />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "saved" && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Choose Saved Card</Label>
                  <select className="border rounded p-2 w-full bg-background">
                    <option>Visa •••• 4416</option>
                    <option>MasterCard •••• 8892</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Enter CVV</Label>
                  <Input placeholder="***" />
                </div>
              </div>
            )}

            {paymentMethod === "cod" && (
              <div className="p-4 border rounded-lg text-sm text-muted-foreground">
                Pay cash when your order is delivered.
              </div>
            )}

            {/* Pay button */}
            <Button
              className="w-full text-lg"
              size="lg"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing
                ? "Processing Payment..."
                : `Pay ₹${total.toFixed(2)}`}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Your payment information is secure and encrypted
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
