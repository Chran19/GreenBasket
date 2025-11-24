"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cartAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Package, Truck, Star, Check } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Fresh Essentials",
    price: 29.99,
    originalPrice: 39.99,
    description: "Perfect for individuals or small families",
    features: [
      "5-7 seasonal items",
      "Mix of fruits & vegetables",
      "Weekly delivery",
      "Free delivery",
      "Cancel anytime",
    ],
  },
  {
    id: "family",
    name: "Family Harvest",
    price: 49.99,
    originalPrice: 64.99,
    description: "Ideal for families of 3-4 people",
    features: [
      "10-12 seasonal items",
      "Fruits, vegetables & herbs",
      "Weekly or bi-weekly delivery",
      "Free delivery",
      "Recipe suggestions",
      "Cancel anytime",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Farm to Table Premium",
    price: 79.99,
    originalPrice: 99.99,
    description: "Complete farm experience for large families",
    features: [
      "15-18 premium items",
      "Fruits, vegetables, herbs & dairy",
      "Flexible delivery schedule",
      "Free priority delivery",
      "Exclusive seasonal items",
      "Recipe cards & cooking tips",
      "Cancel anytime",
    ],
  },
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("family");
  const [deliveryFrequency, setDeliveryFrequency] = useState("weekly");
  const [preferences, setPreferences] = useState<string[]>([]);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handlePreferenceChange = (preference: string, checked: boolean) => {
    if (checked) {
      setPreferences([...preferences, preference]);
    } else {
      setPreferences(preferences.filter((p) => p !== preference));
    }
  };

  const selectedPlanData = subscriptionPlans.find(
    (plan) => plan.id === selectedPlan
  );

  const startSubscription = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // Redirect to checkout to reuse payment flow
    router.push(
      "/checkout?source=subscription&plan=" +
        selectedPlan +
        "&frequency=" +
        deliveryFrequency
    );
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Fresh Produce Subscriptions
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get the freshest seasonal produce delivered to your door every week.
            Support local farmers while enjoying the convenience of regular
            deliveries.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {subscriptionPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? "ring-2 ring-primary shadow-lg"
                  : "hover:shadow-md"
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold">₹{plan.price}</span>
                    <span className="text-muted-foreground">/week</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{plan.originalPrice}
                    </span>
                    <Badge variant="secondary">
                      Save ₹{(plan.originalPrice - plan.price).toFixed(2)}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customization Options */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Delivery Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Delivery Frequency
                  </Label>
                  <Select
                    value={deliveryFrequency}
                    onValueChange={setDeliveryFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Dietary Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Organic only",
                  "No root vegetables",
                  "Extra fruits",
                  "Herbs & spices",
                  "Local produce only",
                ].map((preference) => (
                  <div key={preference} className="flex items-center space-x-2">
                    <Checkbox
                      id={preference}
                      checked={preferences.includes(preference)}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange(preference, checked as boolean)
                      }
                    />
                    <Label htmlFor={preference} className="text-sm">
                      {preference}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlanData && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {selectedPlanData.name}
                      </span>
                      <span className="font-bold">
                        ₹{selectedPlanData.price}/week
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span>Delivery frequency</span>
                      <span className="capitalize">{deliveryFrequency}</span>
                    </div>

                    {preferences.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">
                          Preferences:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {preferences.map((pref) => (
                            <Badge
                              key={pref}
                              variant="secondary"
                              className="text-xs"
                            >
                              {pref}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total per delivery</span>
                        <span>₹{selectedPlanData.price}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Free Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      Every{" "}
                      {deliveryFrequency === "weekly"
                        ? "week"
                        : deliveryFrequency === "biweekly"
                        ? "2 weeks"
                        : "month"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Satisfaction Guarantee</p>
                    <p className="text-sm text-muted-foreground">
                      Not happy? We'll make it right or refund you
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" onClick={startSubscription}>
              Start My Subscription
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. No commitment required. First delivery within 3-5
              business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
