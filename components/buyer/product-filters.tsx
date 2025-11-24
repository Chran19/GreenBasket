"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  farmers: string[];
  rating: number;
  inStock: boolean;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export function ProductFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    "vegetables",
    "fruits",
    "grains",
    "dairy",
    "herbs",
    "organic",
  ];

  const farmers = [
    "Green Valley Farm",
    "Sunrise Poultry",
    "Mountain Orchard",
    "Heritage Mills",
    "Herb Haven",
    "Earth's Bounty",
  ];

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter((c) => c !== category);

    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleFarmerChange = (farmer: string, checked: boolean) => {
    const newFarmers = checked
      ? [...filters.farmers, farmer]
      : filters.farmers.filter((f) => f !== farmer);

    onFiltersChange({ ...filters, farmers: newFarmers });
  };

  const handlePriceChange = (value: number[]) => {
    onFiltersChange({ ...filters, priceRange: [value[0], value[1]] });
  };

  const activeFiltersCount =
    filters.categories.length +
    filters.farmers.length +
    (filters.rating > 0 ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
        </Button>
      </div>

      {/* Filter sidebar */}
      <div className={`${isOpen ? "block" : "hidden"} lg:block space-y-6`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Filters</h3>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Clear all
            </Button>
          )}
        </div>

        {/* Price Range */}
        <Card
          className="border-none shadow-md bg-white/70 backdrop-blur-sm"
          style={{
            backgroundImage: "url('/images/Products-bg.jpg')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Price Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Slider
              value={filters.priceRange}
              onValueChange={handlePriceChange}
              max={50}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>₹{filters.priceRange[0]}</span>
              <span>₹{filters.priceRange[1]}</span>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card
          className="border-none shadow-md bg-white/70 backdrop-blur-sm"
          style={{
            backgroundImage: "url('/images/Products-bg.jpg')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked) =>
                    handleCategoryChange(category, checked as boolean)
                  }
                />
                <Label htmlFor={category} className="text-sm font-normal">
                  {category}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Farmers */}
        <Card
          className="border-none shadow-md bg-white/70 backdrop-blur-sm"
          style={{
            backgroundImage: "url('/images/Products-bg.jpg')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Farmers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {farmers.map((farmer) => (
              <div key={farmer} className="flex items-center space-x-2">
                <Checkbox
                  id={farmer}
                  checked={filters.farmers.includes(farmer)}
                  onCheckedChange={(checked) =>
                    handleFarmerChange(farmer, checked as boolean)
                  }
                />
                <Label htmlFor={farmer} className="text-sm font-normal">
                  {farmer}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Rating */}
        <Card
          className="border-none shadow-md bg-white/70 backdrop-blur-sm"
          style={{
            backgroundImage: "url('/images/Products-bg.jpg')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Minimum Rating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={filters.rating === rating}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...filters,
                      rating: checked ? rating : 0,
                    })
                  }
                />
                <Label
                  htmlFor={`rating-${rating}`}
                  className="text-sm font-normal"
                >
                  {rating}+ Stars
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Availability */}
        <Card
          className="border-none shadow-md bg-white/70 backdrop-blur-sm"
          style={{
            backgroundImage: "url('/images/Products-bg.jpg')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={filters.inStock}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, inStock: checked as boolean })
                }
              />
              <Label htmlFor="in-stock" className="text-sm font-normal">
                In Stock Only
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
