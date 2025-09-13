"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export function OrdersTable({ orders }) {
  if (!orders?.length) {
    return <div className="text-center py-12 text-gray-500">No orders yet</div>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">{order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{order.status}</p>
              </div>
            </div>
            <div className="divide-y">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 py-3">
                  <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={
                        item.image ||
                        item.images?.[0] ||
                        "https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg"
                      }
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="font-medium">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-500">
                {order.currency || "INR"}
              </div>
              <div className="text-lg font-semibold">
                Total: ₹{order.amount?.toFixed?.(2) ?? order.amount}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
