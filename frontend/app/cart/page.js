"use client";

import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStaticTranslation } from "@/lib/use-static-translation";

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useStaticTranslation();
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } =
    useCartStore();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = () => {
    setCheckingOut(true);
    console.log(user);
    if (!user) {
      router.push("/sign-in");
      return;
    }
    // Proceed with checkout
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t("cart.empty")}
          </h1>
          <p className="text-gray-600 mb-8">
            {t("cart.emptyDesc")}
          </p>
          <Link href="/products">
            <Button
              size="lg"
              className="rounded-full inline-flex items-center justify-center gap-2 bg-black text-white shadow-md hover:shadow-lg hover:bg-black/90 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t("cart.continueShopping")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("cart.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-gray-300 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 relative overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={
                        item.images?.[0] ||
                        "https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg"
                      }
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-gray-600">₹{item.price}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="h-8 w-8 rounded-full transition active:scale-95 hover:shadow-sm"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 rounded-full transition active:scale-95 hover:shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 transition active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm sticky top-6">
            <CardContent className="p-6">
              <h2 className="font-semibold text-xl mb-4">Order Summary</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>{t("cart.subtotal")}</span>
                  <span>₹{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("cart.shipping")}</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{t("cart.total")}</span>
                    <span>₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full rounded-full mb-3 inline-flex items-center justify-center gap-2 bg-black text-white shadow-md hover:shadow-lg hover:bg-black/90 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                size="lg"
                aria-busy={checkingOut}
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  t("cart.checkout")
                )}
              </Button>

              <Link href="/products">
                <Button
                  variant="outline"
                  className="w-full rounded-full inline-flex items-center justify-center gap-2 border-2 hover:bg-white hover:shadow-md active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("cart.continueShopping")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
