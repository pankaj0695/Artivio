"use client";

import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardKPIs } from "@/components/artisan/dashboard-kpis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getArtisanStats, getProducts, getArtisanOrders } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import RevenueOrdersChart from "@/components/artisan/revenueOrderCharts";
import { Plus, Package, ShoppingBag } from "lucide-react";

function DashboardContent() {
  const { user } = useAuth();

  const { data: statsData } = useQuery({
    queryKey: ["artisan-stats", user?.uid],
    queryFn: () => getArtisanStats(user.uid),
    enabled: !!user,
  });

  const { data: productsData } = useQuery({
    queryKey: ["artisan-products", user?.uid],
    queryFn: () => getProducts({ artisanId: user.uid, limit: 5 }),
    enabled: !!user,
  });
  console.log("Products Data:", productsData);

  const { data: ordersData } = useQuery({
    queryKey: ["artisan-orders", user?.uid],
    queryFn: () => getArtisanOrders(user.uid),
    enabled: !!user,
    
  });
  console.log("orders data:",ordersData)
  const formatDate = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's an overview of your business.
          </p>
        </div>
        <Link href="/artisan/products/new">
          <Button className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <DashboardKPIs stats={statsData?.stats} />
      <RevenueOrdersChart orders={ordersData?.orders} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Recent Products */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Recent Products
            </CardTitle>
            <Link href="/artisan/products">
              <Button variant="outline" size="sm" className="rounded-full">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {productsData?.products?.length > 0 ? (
              <div className="space-y-4">
                {productsData.products.map((product) => {
                  const displayValue =
                    product.images?.[0] || product.title.charAt(0);
                  const isImage =
                    typeof displayValue === "string" &&
                    displayValue.startsWith("http");

                  return (
                    <Link
                      key={product.id}
                      href={`../products/${product.id}`}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                    >
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-semibold overflow-hidden">
                        {isImage ? (
                          <img
                            src={displayValue}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          displayValue
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{product.title}</h4>
                        <p className="text-sm text-gray-600">
                          ₹{product.price} • {product.stock} in stock
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products yet</p>
                <Link href="/artisan/products/new">
                  <Button className="mt-4 rounded-full">
                    Add Your First Product
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Recent Orders
            </CardTitle>
            <Link href="/artisan/orders">
              <Button variant="outline" size="sm" className="rounded-full">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersData?.orders?.length > 0 ? (
              <div className="space-y-4">
  {ordersData.orders.map((order) => {
    const firstItem = order.items?.[0];
    const buyerName = order.buyer?.name || "Unknown Buyer";
    const buyerEmail = order.buyer?.email || "";
    const buyerAvatar = order.buyer?.avatar || null;

    return (
      <Link
        key={order.id}
        href={`../orders/${order.id}`}
        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          {firstItem?.image ? (
            <img
              src={firstItem.image}
              alt={firstItem.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-white font-semibold">
              {firstItem?.title?.charAt(0) || "?"}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-medium">{firstItem?.title}</h4>
          <p className="text-sm text-gray-600">
            Buyer: {buyerName} {buyerEmail && `• ${buyerEmail}`}
          </p>
          <p className="text-sm text-gray-600">
            ₹{order.amount} {order.currency} • {formatDate(order.createdAt)}
          </p>
        </div>

        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            order.status === "created"
              ? "bg-yellow-100 text-yellow-700"
              : order.status === "shipped"
              ? "bg-blue-100 text-blue-700"
              : order.status === "delivered"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {order.status}
        </span>
      </Link>
    );
  })}
</div>

            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <Link href="/artisan/products/new">
              <Button
                variant="outline"
                className="w-full justify-start rounded-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Product
              </Button>
            </Link>
            <Link href="/artisan/products">
              <Button
                variant="outline"
                className="w-full justify-start rounded-full"
              >
                <Package className="mr-2 h-4 w-4" />
                Manage Products
              </Button>
            </Link>
            <Link href="/artisan/orders">
              <Button
                variant="outline"
                className="w-full justify-start rounded-full"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                View Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ArtisanDashboardPage() {
  return (
    <RoleGuard requiredRole="artisan">
      <DashboardContent />
    </RoleGuard>
  );
}
