"use client";

import { useQuery } from '@tanstack/react-query';
import { RoleGuard } from '@/components/auth/role-guard';
import { DashboardKPIs } from '@/components/artisan/dashboard-kpis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getArtisanStats, getProducts } from '@/lib/firestore';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Plus, Package, ShoppingBag } from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();

  const { data: statsData } = useQuery({
    queryKey: ['artisan-stats', user?.uid],
    queryFn: () => getArtisanStats(user.uid),
    enabled: !!user,
  });

  const { data: productsData } = useQuery({
    queryKey: ['artisan-products', user?.uid],
    queryFn: () => getProducts({ artisanId: user.uid, limit: 5 }),
    enabled: !!user,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your business.</p>
        </div>
        <Link href="/artisan/products/new">
          <Button className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <DashboardKPIs stats={statsData?.stats} />

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
                {productsData.products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-semibold">
                      {product.title.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{product.title}</h4>
                      <p className="text-sm text-gray-600">₹{product.price} • {product.stock} in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products yet</p>
                <Link href="/artisan/products/new">
                  <Button className="mt-4 rounded-full">Add Your First Product</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <Link href="/artisan/products/new">
              <Button variant="outline" className="w-full justify-start rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Add New Product
              </Button>
            </Link>
            <Link href="/artisan/products">
              <Button variant="outline" className="w-full justify-start rounded-full">
                <Package className="mr-2 h-4 w-4" />
                Manage Products
              </Button>
            </Link>
            <Link href="/artisan/orders">
              <Button variant="outline" className="w-full justify-start rounded-full">
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