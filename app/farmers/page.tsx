"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Calendar, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { farmersAPI } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await farmersAPI.getAll({ limit: 50 });
        const farmersData = res?.data || [];
        setFarmers(farmersData);
      } catch (error) {
        console.error("Failed to load farmers:", error);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Meet Our Farmers</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get to know the dedicated farmers who grow your food with passion,
            care, and sustainable practices.
          </p>
        </div>

        {/* Farmers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {farmers.map((farmer) => (
            <Card
              key={farmer.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video relative">
                <Image
                  src={farmer.farmer_profile?.image || "/placeholder.png"}
                  alt={farmer.name}
                  fill
                  className="object-cover"
                />
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{farmer.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {farmer.farmer_profile?.location || ""}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {farmer.statistics?.averageRating ?? 4.5}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ({farmer.statistics?.reviewCount ?? 0} reviews)
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {farmer.farmer_profile?.description || ""}
                </p>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Est. {farmer.farmer_profile?.established || ""}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Certifications</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(farmer.farmer_profile?.certifications || []).map(
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
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Specialties</p>
                  <div className="flex flex-wrap gap-1">
                    {(farmer.farmer_profile?.specialties || []).map(
                      (specialty: string) => (
                        <Badge
                          key={specialty}
                          variant="outline"
                          className="text-xs"
                        >
                          {specialty}
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <Link href={`/farmer-profile/${farmer.id}`}>
                    View Products
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 p-8 bg-muted/50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">
            Want to Join Our Community?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Are you a farmer interested in selling directly to consumers? Join
            our platform and connect with customers who value fresh, local
            produce.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Become a Farmer</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
