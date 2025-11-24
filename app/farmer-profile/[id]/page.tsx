"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/product/product-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Star,
  MapPin,
  Calendar,
  Award,
  MessageCircle,
  Send,
} from "lucide-react";
import { farmersAPI, productsAPI, buyerAPI } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function FarmerProfilePage() {
  const params = useParams();
  const farmerId = params.id as string;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({
    message: "",
  });
  const [isSending, setIsSending] = useState(false);

  const [farmer, setFarmer] = useState<any | null>(null);
  const [farmerProducts, setFarmerProducts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Get farmer profile
        const farmerRes: any = await farmersAPI.getById(farmerId);
        const farmerData = farmerRes?.data;
        setFarmer(farmerData);

        // Get farmer products
        const productsRes: any = await productsAPI.getAll({ limit: 200 });
        const items = productsRes?.data || productsRes?.data?.data || [];
        const products = items.filter((p: any) => p.farmer?.id === farmerId);
        setFarmerProducts(
          products.map((p: any) => ({
            id: p.id,
            name: p.title ?? p.name ?? "",
            price: Number(p.price ?? 0),
            unit: p.unit,
            image: p.photos?.[0] || "/placeholder.png",
            inStock: (p.stock ?? 0) > 0,
            farmer: p.farmer?.name,
            rating: p.averageRating ?? 4,
            reviewCount: p.reviewCount ?? 0,
            category: p.category,
          }))
        );
      } catch (error) {
        console.error("Failed to load farmer profile:", error);
      }
    };
    load();
  }, [farmerId]);

  const handleSendMessage = async () => {
    if (!messageForm.message.trim() || !isAuthenticated || user?.role !== "buyer") return;

    setIsSending(true);
    try {
      await buyerAPI.sendMessage(farmerId, messageForm.message.trim());
      setMessageForm({ message: "" });
      setIsMessageDialogOpen(false);
      // Redirect to messages page with this conversation
      router.push(`/buyer/messages?conversation=${farmerId}`);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickMessage = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "buyer") {
      alert("Please login as a buyer to message farmers.");
      return;
    }
    router.push(`/buyer/messages?conversation=${farmerId}`);
  };

  if (!farmer) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Farmer not found</h1>
            <p className="text-muted-foreground">
              The farmer profile you're looking for doesn't exist.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/farmers">Back to Farmers</Link>
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
        {/* Farmer Profile Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-32 h-32 relative rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={farmer.farmer_profile?.image || "/placeholder.png"}
                      alt={farmer.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{farmer.name}</h1>
                      <div className="flex items-center gap-4 text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{farmer.farmer_profile?.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Est. {farmer.farmer_profile?.established}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i <
                                Math.floor(
                                  farmer.statistics?.averageRating ?? 4.5
                                )
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">
                          {farmer.statistics?.averageRating ?? 4.5}
                        </span>
                        <span className="text-muted-foreground">
                          ({farmer.statistics?.reviewCount ?? 0} reviews)
                        </span>
                      </div>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      {farmer.farmer_profile?.description}
                    </p>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="font-medium">Certifications</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(farmer.farmer_profile?.certifications ?? []).map(
                            (cert: string) => (
                              <Badge key={cert} variant="secondary">
                                {cert}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="font-medium mb-2">Specialties</p>
                        <div className="flex flex-wrap gap-2">
                          {(farmer.farmer_profile?.specialties ?? []).map(
                            (specialty: string) => (
                              <Badge key={specialty} variant="outline">
                                {specialty}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Card */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Contact {farmer.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAuthenticated && user?.role === "buyer" ? (
                  <>
                    <Button className="w-full" onClick={handleQuickMessage}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message Farmer
                    </Button>
                    <Dialog
                      open={isMessageDialogOpen}
                      onOpenChange={setIsMessageDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Send Quick Message
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Send Message to {farmer.name}</DialogTitle>
                          <DialogDescription>
                            Send a message directly to the farmer. They'll receive
                            your inquiry and get back to you soon.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                              id="message"
                              placeholder="Type your message here..."
                              rows={4}
                              value={messageForm.message}
                              onChange={(e) =>
                                setMessageForm({
                                  ...messageForm,
                                  message: e.target.value,
                                })
                              }
                              disabled={isSending}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSendMessage}
                              disabled={!messageForm.message.trim() || isSending}
                              className="flex-1"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {isSending ? "Sending..." : "Send Message"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsMessageDialogOpen(false)}
                              disabled={isSending}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href="/login">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Sign in to Contact
                    </Link>
                  </Button>
                )}

                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Have questions about products or farming practices? Send a
                    message above!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Farm Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Farm Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Products Available
                  </span>
                  <span className="font-medium">{farmerProducts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Years in Business
                  </span>
                  <span className="font-medium">
                    {new Date().getFullYear() -
                      Number.parseInt(farmer.established)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Rating</span>
                  <span className="font-medium">{farmer.rating}/5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Reviews</span>
                  <span className="font-medium">{farmer.reviewCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Products from {farmer.name}</h2>
            <Badge variant="secondary">{farmerProducts.length} products</Badge>
          </div>

          {farmerProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {farmerProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No products available from this farmer at the moment.
                </p>
                <Button asChild>
                  <Link href="/products">Browse All Products</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Mock reviews */}
              {[
                {
                  id: 1,
                  author: "Sarah M.",
                  rating: 5,
                  date: "2024-01-15",
                  comment: `Amazing quality produce from ${farmer.name}! Everything is always fresh and delicious.`,
                  verified: true,
                },
                {
                  id: 2,
                  author: "Mike R.",
                  rating: 4,
                  date: "2024-01-10",
                  comment:
                    "Great farmer with excellent customer service. Highly recommend!",
                  verified: true,
                },
                {
                  id: 3,
                  author: "Emma L.",
                  rating: 5,
                  date: "2024-01-08",
                  comment:
                    "Best organic produce I've found. The quality is consistently outstanding.",
                  verified: true,
                },
              ].map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{review.author}</span>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {review.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
