"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  MapPin,
  Award,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { ReviewForm } from "@/components/reviews/review-form";
import { useAuth } from "@/hooks/use-auth";
import { ReviewList } from "@/components/reviews/review-list";
import { useRouter } from "next/navigation";
// TODO: Replace with backend hook/useProducts when connected to live data
import { productsAPI } from "@/lib/api";
import { MessageCircle } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<any | null>(null);
  const [farmer, setFarmer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await productsAPI.getById(productId);
        const p = res?.data || res?.product || null;
        if (!p) throw new Error("Product not found");
        setProduct({
          id: p.id,
          name: p.title,
          description: p.description,
          price: Number(p.price ?? 0),
          unit: p.unit,
          image: p.photos?.[0] || "/placeholder.png",
          inStock: (p.stock ?? 0) > 0,
          category: p.category,
          rating: p.averageRating ?? 4,
          farmer: p.farmer?.name,
        });
        setFarmer(p.farmer || null);
        // Normalize reviews from backend
        if (Array.isArray(p.reviews)) {
          setReviews(
            p.reviews.map((r: any) => ({
              id: r.id,
              author: r.buyer?.name || "Anonymous",
              rating: r.rating,
              date: (r.created_at || new Date().toISOString()).split("T")[0],
              comment: r.comment || "",
              verified: !!r.is_verified,
              authorRole: r.buyer?.id ? "buyer" : "farmer",
            }))
          );
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([
    {
      id: 1,
      author: "Sarah M.",
      rating: 5,
      date: "2024-01-15",
      comment: "Absolutely fresh and delicious! Will definitely order again.",
      verified: true,
      helpful: 12,
    },
    {
      id: 2,
      author: "Mike R.",
      rating: 4,
      date: "2024-01-10",
      comment: "Great quality produce. Fast delivery too.",
      verified: true,
      helpful: 8,
    },
    {
      id: 3,
      author: "Emma L.",
      rating: 5,
      date: "2024-01-08",
      comment: "Best organic produce I've found online. Highly recommend!",
      verified: true,
      helpful: 15,
    },
  ]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <p className="text-muted-foreground">
              {error || "The product you're looking for doesn't exist."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const images = [product.image];
  const discountPercentage = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const handleAddToCart = () => {
    if (product.inStock && user?.role === "buyer") {
      addItem(product.id as unknown as string, quantity);
    }
  };

  const handleReviewSubmitted = (newReview: any) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <span>/</span>
          <Link
            href={`/category/${product.category
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
            className="hover:text-foreground"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg border">
              <Image
                src={images[selectedImage] || "/placeholder.png"}
                alt={product.name}
                fill
                className="object-cover"
              />
              {discountPercentage > 0 && (
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                  -{discountPercentage}%
                </Badge>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden ${
                    selectedImage === index ? "border-primary" : "border-border"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.png"}
                    alt={`${product.name} ${index + 1}`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href={`/farmer-profile/${farmer?.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {product.farmer}
                </Link>
                {farmer && (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">
                        {farmer.rating}
                      </span>
                    </div>
                    {isAuthenticated &&
                      user?.role === "buyer" &&
                      farmer?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/buyer/messages?conversation=${farmer.id}`
                            )
                          }
                          className="ml-auto"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      )}
                  </>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({reviews.length} reviews)
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
                <span className="text-muted-foreground">{product.unit}</span>
              </div>

              <p className="text-muted-foreground mb-6">
                {product.description}
              </p>
            </div>

            {/* Quantity and Add to Cart */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Quantity:</label>
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="px-4 py-2 min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      size="lg"
                      disabled={!product.inStock || user?.role !== "buyer"}
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {product.inStock
                        ? user?.role === "buyer"
                          ? "Add to Cart"
                          : "Login as buyer"
                        : "Out of Stock"}
                    </Button>
                    <Button variant="outline" size="lg">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="lg">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>

                  {product.inStock && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ In Stock - Ready to ship
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Free Delivery</p>
                <p className="text-xs text-muted-foreground">
                  On orders over ₹50
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Quality Guarantee</p>
                <p className="text-xs text-muted-foreground">Fresh or refund</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Easy Returns</p>
                <p className="text-xs text-muted-foreground">30-day policy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="farmer">About Farmer</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Product Description</h3>
                <p className="text-muted-foreground mb-4">
                  {product.description}
                </p>
                <p className="text-muted-foreground">
                  Our {product.name.toLowerCase()} are carefully selected and
                  harvested at peak freshness to ensure the best quality and
                  taste. Grown using sustainable farming practices, these
                  products are perfect for your healthy lifestyle.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-8">
              <ReviewForm
                productId={product.id}
                productName={product.name}
                onReviewSubmitted={handleReviewSubmitted}
              />

              <div>
                <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
                <ReviewList reviews={reviews} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="farmer" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {farmer ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 relative rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={farmer.image || "/placeholder.png"}
                          alt={farmer.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          {farmer.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{farmer.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            <span>Est. {farmer.established}</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          {farmer.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(farmer?.certifications ?? []).map(
                            (cert: string) => (
                              <Badge
                                key={cert}
                                variant="secondary"
                                className="text-xs"
                              >
                                {cert}
                              </Badge>
                            )
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button asChild>
                            <Link href={`/farmer-profile/${farmer.id}`}>
                              View Farmer Profile
                            </Link>
                          </Button>
                          {isAuthenticated && user?.role === "buyer" && (
                            <Button
                              variant="outline"
                              onClick={() =>
                                router.push(
                                  `/buyer/messages?conversation=${farmer.id}`
                                )
                              }
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message Farmer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-4">
                      About {product.farmer}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {product.farmer} is committed to sustainable agriculture
                      and providing the freshest produce to our community. With
                      years of experience, they use environmentally friendly
                      farming practices to grow high-quality products.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
