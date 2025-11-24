"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ProductForm } from "@/components/farmer/product-form";
import { supabase } from "@/config/supabasefront";
import { useAuth } from "@/hooks/use-auth";

export default function NewProductPage() {
  const { user, isAuthenticated, hasHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || user?.role !== "farmer") {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  const handleSave = async (payload: any) => {
    try {
      // Insert using correct keys from ProductForm
      const { data, error } = await supabase
        .from("products")
        .insert([payload]) // MUST be array
        .select("*")
        .single();

      if (error) {
        console.error("Add Product failed:", error);
        alert(error.message || "Failed to add product");
        return;
      }

      alert("Product added successfully");
      router.push("/farmer/inventory");
    } catch (err) {
      console.error("Add Product error:", err);
      alert("Something went wrong while adding product");
    }
  };

  const handleCancel = () => {
    router.push("/farmer");
  };

  if (!hasHydrated) return null;
  if (!isAuthenticated || user?.role !== "farmer") return null;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <ProductForm onSave={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  );
}
