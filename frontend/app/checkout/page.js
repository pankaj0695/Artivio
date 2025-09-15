"use client";

import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/firestore";

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  const handlePlaceOrder = async () => {
    const order = {
      userId: user.uid,
      items: items.map((i) => ({
        productId: i.id,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        image: i.images?.[0] || null,
      })),
      amount: getTotalPrice(),
      currency: "INR",
      status: "created",
      shippingAddress: "Stubbed Address, City, Country",
    };

    const { id, error } = await createOrder(order);
    if (!error) {
      clearCart();
      router.push("/orders");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>Items</div>
            <div className="font-semibold">{items.length}</div>
          </div>
          <div className="flex items-center justify-between">
            <div>Total</div>
            <div className="text-xl font-bold">
              ₹{getTotalPrice().toFixed(2)}
            </div>
          </div>
          <Button onClick={handlePlaceOrder} className="w-full rounded-full">
            Place Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
