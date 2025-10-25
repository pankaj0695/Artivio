"use client";

import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardKPIs } from "@/components/artisan/dashboard-kpis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getArtisanStats,
  getAllArtisanOrders,
  getArtisanProducts,
  getArtisanOrders,
  getArtisanAppointments,
  getArtisanServices,
} from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import RevenueOrdersChart from "@/components/artisan/revenueOrderCharts";
import { Plus, Package, ShoppingBag, Calendar } from "lucide-react";
import { ViewsBadge } from "@/components/artisan/views-badge";
import { useStaticTranslation } from "@/lib/use-static-translation";

function DashboardContent() {
  const { user } = useAuth();
  const { t } = useStaticTranslation();

  const { data: statsData } = useQuery({
    queryKey: ["artisan-stats", user?.uid],
    queryFn: () => getArtisanStats(user.uid),
    enabled: !!user,
  });

  const { data: productsData } = useQuery({
    queryKey: ["artisan-products", user?.uid],
    queryFn: () => getArtisanProducts(user.uid),
    enabled: !!user,
  });

  const { data: servicesData } = useQuery({
    queryKey: ["artisan-services", user?.uid],
    queryFn: () => getArtisanServices(user.uid),
    enabled: !!user,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["artisan-orders", user?.uid],
    queryFn: () => getArtisanOrders(user.uid),
    enabled: !!user,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ["artisan-appointments", user?.uid],
    queryFn: () => getArtisanAppointments(user.uid),
    enabled: !!user,
  });

  const { data: orders1Data } = useQuery({
    queryKey: ["artisan-all-orders", user?.uid],
    queryFn: () => getAllArtisanOrders(user.uid),
    enabled: !!user,
  });

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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{t("dashboard.heading")}</h1>
          <p className="text-gray-600 mt-2">
            {t("dashboard.welcomeMessage")}
          </p>
        </div>

        <Link href="/artisan/products/new">
          <Button className="rounded-full flex items-center bg-black text-white hover:bg-black/90 active:bg-black/80 active:scale-[.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors disabled:opacity-60">
            <Plus className="mr-2 h-5 w-5" />
            <span>{t("dashboard.addProduct")}</span>
          </Button>
        </Link>
      </div>

      {/* KPIs and Charts */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 mb-8">
        <DashboardKPIs stats={statsData?.stats} />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <RevenueOrdersChart orders={orders1Data?.orders} />
      </div>

      {/* 2x2 Grid: Products | Services , Orders | Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Recent Products */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              {t("dashboard.recentProducts")}
            </CardTitle>
            <Link href="/artisan/products">
              <Button
                size="sm"
                className="rounded-full flex items-center bg-black text-white hover:bg-black/90 active:bg-black/80 active:scale-[.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors disabled:opacity-60"
              >
                {t("dashboard.viewAll")}
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
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-black ring-offset-2"
                    >
                      <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white font-semibold overflow-hidden">
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
                          ₹{product.price}
                        </p>
                      </div>
                      <ViewsBadge productId={product.id} className="ml-auto" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t("dashboard.noProducts")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              {t("dashboard.recentServices")}
            </CardTitle>
            <Link href="/artisan/services">
              <Button
                size="sm"
                className="rounded-full flex items-center bg-black text-white hover:bg-black/90 active:bg-black/80 active:scale-[.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors disabled:opacity-60"
              >
                {t("dashboard.viewAll")}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {servicesData?.products?.length > 0 ? (
              <div className="space-y-4">
                {servicesData.products.map((service) => {
                  const displayValue =
                    service.images?.[0] || service.title.charAt(0);
                  const isImage =
                    typeof displayValue === "string" &&
                    displayValue.startsWith("http");

                  return (
                    <Link
                      key={service.id}
                      href={`../services/${service.id}`}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-black ring-offset-2"
                    >
                      <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white font-semibold overflow-hidden">
                        {isImage ? (
                          <img
                            src={displayValue}
                            alt={service.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          displayValue
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{service.title}</h4>
                        <p className="text-sm text-gray-600">
                          ₹{service.price}
                        </p>
                      </div>
                      <ViewsBadge productId={service.id} className="ml-auto" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t("dashboard.noServices")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5" />
              {t("dashboard.recentOrders")}
            </CardTitle>
            <Link href="/artisan/orders">
              <Button
                size="sm"
                className="rounded-full flex items-center bg-black text-white hover:bg-black/90 active:bg-black/80 active:scale-[.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors disabled:opacity-60"
              >
                {t("dashboard.viewAll")}
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

                  return (
                    <Link
                      key={order.id}
                      href={`../orders/${order.id}`}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-black ring-offset-2"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        {firstItem?.image ? (
                          <img
                            src={firstItem.image}
                            alt={firstItem.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black text-white font-semibold">
                            {firstItem?.title?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-medium">{firstItem?.title}</h4>
                        <p className="text-sm text-gray-600">
                          {t("dashboard.buyer")}: {buyerName} {buyerEmail && `• ${buyerEmail}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          ₹{order.amount} {order.currency} •{" "}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === "delivered"
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
                <p className="text-gray-500">{t("dashboard.noOrders")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              {t("dashboard.recentAppointments")}
            </CardTitle>
            <Link href="/artisan/appointments">
              <Button
                size="sm"
                className="rounded-full flex items-center bg-black text-white hover:bg-black/90 active:bg-black/80 active:scale-[.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors disabled:opacity-60"
              >
                {t("dashboard.viewAll")}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {appointmentsData?.orders?.length > 0 ? (
              <div className="space-y-4">
                {appointmentsData.orders.map((appt) => {
                  const firstItem = appt.items?.[0];
                  const customerName = appt.buyer?.name || "Unknown";
                  const customerEmail = appt.buyer?.email || "";

                  return (
                    <Link
                      key={appt.id}
                      href={`../appointments/${appt.id}`}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-black ring-offset-2"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black text-white flex items-center justify-center font-semibold">
                        {firstItem.image ? (
                          <img
                            src={firstItem.image}
                            alt={customerName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          customerName.charAt(0)
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-medium">
                          {firstItem.title || "Service"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {customerName} {customerEmail && `• ${customerEmail}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("dashboard.appointmentDate")}: {formatDate(appt.bookingDate)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t("dashboard.noAppointments")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <Link href="/artisan/products/new">
              <Button
                variant="outline"
                className="w-full justify-start rounded-full flex items-center border-gray-300 text-gray-800 hover:bg-black hover:text-white hover:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:scale-95 transition"
              >
                <Plus className="mr-2 h-5 w-5 flex-shrink-0" />
                <span>{t("dashboard.addNewProduct")}</span>
              </Button>
            </Link>

            <Link href="/artisan/products">
              <Button
                variant="outline"
                className="w-full justify-start rounded-full flex items-center border-gray-300 text-gray-800 hover:bg-black hover:text-white hover:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:scale-95 transition"
              >
                <Package className="mr-2 h-5 w-5 flex-shrink-0" />
                <span>{t("dashboard.manageProducts")}</span>
              </Button>
            </Link>

            <Link href="/artisan/orders">
              <Button
                variant="outline"
                className="w-full justify-start rounded-full flex items-center border-gray-300 text-gray-800 hover:bg-black hover:text-white hover:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:scale-95 transition"
              >
                <ShoppingBag className="mr-2 h-5 w-5 flex-shrink-0" />
                <span>{t("dashboard.viewOrders")}</span>
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
