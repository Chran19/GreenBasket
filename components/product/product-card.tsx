"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
type UIProduct = {
  id: string;
  name: string;
  price: number;
  unit?: string;
  image?: string;
  originalPrice?: number;
  inStock: boolean;
  farmer?: string;
  rating?: number;
  reviewCount?: number;
};

interface ProductCardProps {
  product: UIProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const discountPercentage = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const handleAddToCart = () => {
    if (product.inStock) {
      addItem(product.id as unknown as string, 1);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-0">
        <div className="relative">
          <Link href={`/product/${product.id}`}>
            <div className="aspect-square relative overflow-hidden rounded-t-lg">
              <Image
                src={product.image || "/corn.jpg"}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          </Link>
          {discountPercentage > 0 && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
              -{discountPercentage}%
            </Badge>
          )}
          {!product.inStock && (
            <Badge variant="secondary" className="absolute top-2 right-2">
              Out of Stock
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground">{product.farmer}</div>

          <Link href={`/product/${product.id}`}>
            <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">₹{product.price}</span>

            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice}
              </span>
            )}

            <span className="text-sm text-muted-foreground">
              {product.unit}
            </span>
          </div>

          <Button
            className="w-full"
            disabled={!product.inStock}
            size="sm"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.inStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
