"use client";

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { OrdersTable } from "@/components/ui/orders-table";
import { getUserOrders } from "@/lib/firestore";

export default function ProfilePage() {
  const { user, profile } = useAuth();

  const { data } = useQuery({
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold mb-2">
            {profile?.name || user.displayName || "Your Profile"}
          </h1>
          <p className="text-gray-600">{profile?.email || user.email}</p>
          <p className="text-gray-600 capitalize">
            Role: {profile?.role || "customer"}
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Orders</h2>
        <OrdersTable orders={data?.orders || []} />
      </div>
    </div>
  );
}
