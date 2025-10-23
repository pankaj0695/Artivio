"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getProducts,
  getAllArtisanProducts,
  getAllArtisanServices,
} from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Edit, Eye } from "lucide-react";
import { ViewsBadge } from "@/components/artisan/views-badge";

function ProductsContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["artisan-products", user?.uid],
    queryFn: () => getAllArtisanServices(user.uid),
    enabled: !!user,
  });

  const filteredProducts =
    productsData?.products?.filter((product) =>
      product.title?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Services</h1>
          <p className="text-gray-600 mt-2">Manage your service catalog</p>
        </div>
        <Link href="/artisan/products/new">
          <Button className="rounded-full flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Add Services
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 animate-pulse rounded-2xl aspect-[3/4]"
              />
            ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-100 rounded-2xl p-12 mb-6">
              <Plus className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start by adding your first product"}
            </p>
            <Link href="/artisan/products/new">
              <Button className="rounded-full flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="group rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="relative aspect-square overflow-hidden rounded-t-2xl">
                <Image
                  src={
                    product.images?.[0] ||
                    "https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg"
                  }
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <Badge
                    variant={
                      product.status === "active" ? "default" : "secondary"
                    }
                  >
                    {product.status}
                  </Badge>
                </div>
                {(product.type || "product") !== "service" &&
                  product.stock < 10 && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-red-500">Low Stock</Badge>
                    </div>
                  )}
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                  {product.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg text-primary">
                    ₹{product.price}
                  </span>
                  <div className="flex items-center gap-3">
                    <ViewsBadge productId={product.id} />
                    {(product.type || "product") !== "service" && (
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/products/${product.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      <span>View</span>
                    </Button>
                  </Link>

                  <Link
                    href={`/artisan/products/${product.id}/edit`}
                    className="flex-1"
                  >
                    <Button
                      size="sm"
                      className="w-full rounded-full flex items-center justify-center"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      <span>Edit</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ArtisanProductsPage() {
  return (
    <RoleGuard requiredRole="artisan">
      <ProductsContent />
    </RoleGuard>
  );
}
