"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslatedContent } from "@/lib/use-translated-content";
import { useStaticTranslation } from "@/lib/use-static-translation";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";

export function ProductCard({ product, artisanInfo }) {
  const { language } = useLanguage();
  const { t } = useStaticTranslation();
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);

  // Translate product content (dynamic content via API)
  const { translated: translatedTitle } = useTranslatedContent(
    product.title,
    language
  );
  const { translated: translatedDescription } = useTranslatedContent(
    product.description,
    language
  );

  const isInCart = items.some((item) => item.id === product.id);
  const isService = (product.type || "product") === "service";

  const handleToggleCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCart) {
      removeItem(product.id);
      toast.error(`${product.title} ${t("products.remove")}`);
    } else {
      addItem(product);
      toast.success(`${product.title} ${t("products.add")}`);
    }
  };

  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 w-[32rem]">
      <CardContent className="p-6 space-y-4">
        {/* Artisan Info */}
        {artisanInfo && (
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/artisan/${product.artisanId}`}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-primary">
                <Image
                  src={artisanInfo.avatar || "/default-avatar.png"}
                  alt={artisanInfo.name || "Unknown Artisan"}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 text-xs">
                  {artisanInfo.name || "Unknown Artisan"}
                </span>
                <span className="text-xs text-gray-500">
                  {t("products.seller")}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Product Image */}
        <div className="relative w-full aspect-square rounded-md overflow-hidden group">
          <Image
            src={product.images?.[0] || "/placeholder.png"}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2">
            <Badge className="text-xs px-2 py-1">
              {product.type || "Product"}
            </Badge>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
            {translatedTitle}
          </h3>
          <p className="text-gray-600 text-xs line-clamp-2">
            {translatedDescription}
          </p>
          <div className="flex items-center justify-between">
            <div className="font-bold text-sm text-primary">
              ₹{product.price}
            </div>
            {!isService && (
              <span className="text-xs text-gray-500">
                Stock: {product.stock}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/products/${product.id}`} className="flex-1">
            <Button className="w-full rounded-full text-xs flex items-center justify-center gap-1 py-2 bg-primary text-white hover:bg-primary/90">
              <Eye className="h-4 w-4" /> {t("products.view")}
            </Button>
          </Link>

          {isService ? (
            <Link
              href={{
                pathname: "/checkout/appointment",
                query: {
                  productId: product.id,
                  title: product.title,
                  price: product.price,
                  image: product.images?.[0] || "",
                },
              }}
              className="flex-1"
            >
              <Button className="w-full rounded-full text-xs flex items-center justify-center gap-1 py-2 bg-primary text-white hover:bg-primary/90">
                {t("products.bookAppointment")}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleToggleCart}
              className="flex-1 rounded-full text-xs flex items-center justify-center gap-1 py-2 bg-primary text-white hover:bg-primary/90"
              disabled={product.stock === 0 && !isInCart}
            >
              <ShoppingCart className="h-4 w-4" />{" "}
              {isInCart ? t("products.remove") : t("products.add")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
