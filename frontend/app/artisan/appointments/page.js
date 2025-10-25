"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getAllArtisanOrders, updateOrderStatus,getAllArtisanAppointments } from "@/lib/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useStaticTranslation } from "@/lib/use-static-translation";

export default function ArtisanOrdersPage() {
  const { user } = useAuth();
  const { t } = useStaticTranslation();
  const queryClient = useQueryClient();

  // Fetch artisan orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["artisan-orders", user?.uid],
    queryFn: () =>getAllArtisanAppointments(user.uid),
    enabled: !!user,
  });

  // Mutation to update order status
  const mutation = useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["artisan-orders", user?.uid]);
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    mutation.mutate({ orderId, status: newStatus });
  };

  const formatDateString = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return format(date, "dd MMM yyyy");
  };

  if (isLoading) {
    return <p className="text-center py-8">{t("common.loading")}</p>;
  }

  if (!ordersData || ordersData.orders.length === 0) {
    return <p className="text-center text-gray-500">{t("appointments.noAppointments")}</p>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">{t("appointments.title")}</h1>

      <div className="space-y-6">
        {ordersData.orders.map((order) => (
          <Card key={order.id} className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              {/* Show first product name as card title */}
              <CardTitle>
                {order.items?.[0]?.title || "Order Details"}
              </CardTitle>

              <Select
                value={order.status}
                onValueChange={(value) => handleStatusChange(order.id, value)}
                disabled={order.status !== "paid"} // ✅ Only editable if status is "paid"
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Buyer Info */}
              <div className="text-sm text-gray-700">
                <p>
                  <strong>Buyer:</strong> {order.buyer?.name || "Unknown"}
                </p>
                <p>
                  <strong>Email:</strong> {order.buyer?.email || "-"}
                </p>
                <p>
                  <strong>Phone:</strong> {order.buyer?.phoneNo || "-"}
                </p>
                <p>
                  <strong>Address:</strong> {order.shippingAddress}
                </p>
              </div>

              {/* Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {order.items?.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-white font-semibold">
                          {item.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-gray-600">
                        ₹{item.price} • Booking Date: {formatDateString(order.bookingDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Total:</strong> ₹{order.amount} {order.currency} •{" "}
                  <strong>Date:</strong> {formatDateString(order.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
