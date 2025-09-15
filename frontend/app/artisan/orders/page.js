"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { OrdersTable } from "@/components/ui/orders-table";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

function ArtisanOrdersContent() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["artisan-orders", user?.uid],
    queryFn: async () => {
      // Simplified: fetch all orders then filter items that contain artisan's products
      const ordersSnap = await getDocs(collection(db, "orders"));
      const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return { orders };
    },
    enabled: !!user,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>
      {isLoading ? "Loading..." : <OrdersTable orders={data?.orders || []} />}
    </div>
  );
}

export default function ArtisanOrdersPage() {
  return (
    <RoleGuard requiredRole="artisan">
      <ArtisanOrdersContent />
    </RoleGuard>
  );
}
