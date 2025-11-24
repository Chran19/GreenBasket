"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Save, Eye } from "lucide-react";
import { supabase } from "@/config/supabasefront";
import { useAuth } from "@/hooks/use-auth";

type Product = any;

interface ProductFormProps {
  product?: Product;
  onSave?: (product: Partial<Product>) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const { user } = useAuth(); // logged-in farmer

  const [formData, setFormData] = useState({
    title: product?.title || "",
    description: product?.description || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    category: product?.category || "",
    unit: product?.unit || "",
    isOrganic: product?.is_organic || false,
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>(
    product?.photos ? product.photos : []
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    "Fresh Vegetables",
    "Fruits",
    "Grains & Cereals",
    "Dairy Products",
    "Herbs & Spices",
    "Organic Produce",
  ];

  const units = [
    "per kg",
    "per lb",
    "box",
    "bag",
    "each",
    "bunch",
    "dozen",
    "pint",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) return alert("Product name required");
    if (!formData.category) return alert("Category required");
    if (!formData.unit) return alert("Unit required");
    if (formData.price <= 0) return alert("Price must be greater than 0");
    if (uploadedImages.length === 0 && selectedFiles.length === 0)
      return alert("Upload product image");

    setLoading(true);
    const finalImages: string[] = [];

    // upload NEW images to supabase
    for (const file of selectedFiles) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (error) {
        alert("Image upload failed");
        setLoading(false);
        return;
      }

      const { publicUrl } = supabase.storage
        .from("product-images")
        .getPublicUrl(data.path).data;

      finalImages.push(publicUrl);
    }

    // retain already saved images (for editing)
    if (product?.photos?.length) {
      finalImages.unshift(...product.photos);
    }

    const payload = {
      farmer_id: user?.id, // REQUIRED
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      stock: Number(formData.stock),
      category: formData.category,
      unit: formData.unit,
      is_organic: formData.isOrganic,
      photos: finalImages,
    };

    setLoading(false);

    if (onSave) onSave(payload);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const arr = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...arr]);
    setUploadedImages((prev) => [
      ...prev,
      ...arr.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {product ? "Edit Product" : "Add Product"}
        </h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="outline">
            <Eye className="h-4 w-4 mr-2" /> Preview
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </div>

      {/* BASIC INFORMATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Product Name *"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
            <Textarea
              placeholder="Description *"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={formData.unit}
                onValueChange={(v) => setFormData({ ...formData, unit: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* STOCK & PRICING */}
        <Card>
          <CardHeader>
            <CardTitle>Stock & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Price *"
                value={formData.price}
                min={0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
              <Input
                type="number"
                placeholder="Stock *"
                value={formData.stock}
                min={0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isOrganic}
                onChange={(e) =>
                  setFormData({ ...formData, isOrganic: e.target.checked })
                }
              />
              <Label>Organic</Label>
              {formData.isOrganic && (
                <Badge variant="default" className="bg-green-500 text-white">
                  Organic
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* IMAGES */}
      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button type="button" variant="outline" className="relative">
              <Upload className="w-4 h-4 mr-2" />
              Upload Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      className="rounded-lg w-full h-28 object-cover"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {index === 0 && (
                      <Badge
                        className="absolute bottom-2 left-2"
                        variant="secondary"
                      >
                        Main
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
