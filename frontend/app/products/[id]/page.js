"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/ui/loading";
import { useCartStore } from "@/lib/store";
import { getProduct } from "@/lib/firestore";
import { ShoppingCart, Star, Package, Truck, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const params = useParams();
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => getProduct(params.id),
  });

  if (isLoading) return <LoadingPage />;
  if (error || !data?.product) return <div>Product not found</div>;

  const product = data.product;
  const isInCart = items.some((item) => item.id === product.id);

  const handleToggleCart = () => {
    if (isInCart) {
      removeItem(product.id);
      toast.error(`${product.title} has been removed from your cart.`);
    } else {
      addItem(product);
      toast.success(`${product.title} has been added to your cart.`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square relative overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={
                product.images?.[0] ||
                "https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg"
              }
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.slice(1, 5).map((image, index) => (
                <div
                  key={index}
                  className="aspect-square relative overflow-hidden rounded-lg bg-gray-100"
                >
                  <Image
                    src={image}
                    alt={`${product.title} ${index + 2}`}
                    fill
                    sizes="(max-width: 1024px) 25vw, 12vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {product.videoUrl && (
            <div className="aspect-video relative overflow-hidden rounded-2xl bg-gray-100">
              <video
                controls
                className="w-full h-full object-cover"
                src={product.videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge className="mb-4 capitalize">{product.category}</Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {product.title}
            </h1>
            {product.tagline && (
              <p className="text-xl text-gray-600 mb-4">{product.tagline}</p>
            )}
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-3xl font-bold text-primary">
                ₹{product.price}
              </span>
              <Badge variant={product.stock > 10 ? "secondary" : "destructive"}>
                {product.stock} in stock
              </Badge>
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="rounded-full">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleToggleCart}
              size="lg"
              className="w-full rounded-full text-lg py-6"
              disabled={product.stock === 0 && !isInCart}
              variant={isInCart ? "destructive" : "default"}
            >
              {isInCart ? (
                <Trash2 className="mr-2 h-5 w-5" />
              ) : (
                <ShoppingCart className="mr-2 h-5 w-5" />
              )}
              {isInCart ? "Remove from Cart" : "Add to Cart"}
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="p-4 text-center">
                  <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Handcrafted</p>
                  <p className="text-xs text-gray-600">Made to order</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4 text-center">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Free Shipping</p>
                  <p className="text-xs text-gray-600">Orders over ₹2000</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Artisan Info */}
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">Meet the Artisan</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div>
                  <p className="font-medium">Artisan Profile</p>
                  <p className="text-sm text-gray-600">
                    Handcrafting since 2015
                  </p>
                </div>
                <div className="ml-auto flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="text-sm font-medium">4.9</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
