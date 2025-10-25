import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, ShoppingBag, TrendingUp } from 'lucide-react';
import { useStaticTranslation } from '@/lib/use-static-translation';

export function DashboardKPIs({ stats }) {
  const { t } = useStaticTranslation();
  const kpis = [
    {
      title: t("dashboardKPIs.totalProducts"),
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: t("dashboardKPIs.lowStockItems"),
      value: stats?.lowStockProducts || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
    {
      title: t("dashboardKPIs.totalOrders"),
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'text-green-600',
    },
    {
      title: t("dashboardKPIs.revenue"),
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
              <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}