"use client";

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { OrdersTable } from "@/components/ui/orders-table";
import { getUserOrders } from "@/lib/firestore";
import { LoadingSpinner } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["orders", user?.uid],
    queryFn: () => getUserOrders(user.uid),
    enabled: !!user,
  });

  if (!user && !loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        Please sign in.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Your Orders</h1>
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <OrdersTable orders={data?.orders || []} />
        )}
      </Card>
    </div>
  );
}
