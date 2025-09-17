"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function RevenueOrdersChart({ orders }) {
  const [metric, setMetric] = useState("revenue"); // revenue | orders
  const [duration, setDuration] = useState("15"); // 15 | 30

  // Group orders by day
  const chartData = useMemo(() => {
    if (!orders) return [];

    const map = new Map();

    orders.forEach((order) => {
      const date = order.createdAt.toDate
        ? order.createdAt.toDate()
        : new Date(order.createdAt);
      const day = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });

      if (!map.has(day)) {
        map.set(day, { date: day, revenue: 0, orders: 0 });
      }
      const entry = map.get(day);
      entry.revenue += order.amount || 0;
      entry.orders += 1;
    });

    // Convert to array and sort by date
    let dataArr = Array.from(map.values());

    // Slice by duration
    return dataArr.slice(-Number(duration));
  }, [orders, metric, duration]);

  return (
    <Card className="rounded-2xl border-0 shadow-sm mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Analytics</CardTitle>
        <div className="flex space-x-2">
          {/* Metric dropdown */}
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
            </SelectContent>
          </Select>

          {/* Duration dropdown */}
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">Last 15 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={metric === "revenue" ? "#4CAF50" : "#3B82F6"}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </CardContent>
    </Card>
  );
}

export default RevenueOrdersChart;
