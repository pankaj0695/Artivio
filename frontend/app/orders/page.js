"use client";

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { OrdersTable } from "@/components/ui/orders-table";
import { getUserOrders } from "@/lib/firestore";

export default function OrdersPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["orders", user?.uid],
    queryFn: () => getUserOrders(user.uid),
    enabled: !!user,
  });

  if (!user)
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        Please sign in.
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Your Orders</h1>
      {isLoading ? "Loading..." : <OrdersTable orders={data?.orders || []} />}
    </div>
  );
}
