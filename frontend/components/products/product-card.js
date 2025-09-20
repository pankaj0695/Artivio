"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";

export function ProductCard({ product }) {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);

  const isInCart = items.some((item) => item.id === product.id);
  const isService = (product.type || "product") === "service";

  const handleToggleCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCart) {
      removeItem(product.id);
      toast.error(`${product.title} removed from cart`);
    } else {
      addItem(product);
      toast.success(`${product.title} added to cart`);
    }
  };

  return (
    <Card className="group overflow-hidden rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all duration-300">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={
              product.images?.[0] ||
              "https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg"
            }
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {!isService && product.stock < 10 && (
            <Badge className="absolute top-3 left-3 bg-red-500">
              Low Stock
            </Badge>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {product.title}
          </h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-lg text-primary">₹{product.price}</span>
              {!isService && (
                <span className="text-xs text-gray-500">Stock: {product.stock}</span>
              )}
            </div>
            {isService ? (
              <Button size="sm" className="rounded-full">View</Button>
            ) : (
              <Button
                size="sm"
                onClick={handleToggleCart}
                className="rounded-full"
                variant={isInCart ? "destructive" : "default"}
                disabled={product.stock === 0 && !isInCart}
              >
                {isInCart ? (
                  <Trash2 className="h-4 w-4" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
