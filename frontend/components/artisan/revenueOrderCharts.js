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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIButton } from "@/components/ai/ai-button";
import { getGeminiAnalysis } from "@/lib/gemini";
function RevenueOrdersChart({ orders }) {
  const [metric, setMetric] = useState("revenue"); // dropdown still controls graph
  const [duration, setDuration] = useState("15"); 
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

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

    let dataArr = Array.from(map.values());

    return dataArr.slice(-Number(duration));
  }, [orders, duration]);

  // Gemini API call for combined analysis
  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `
        Analyze the following business data for the last ${duration} days.
        Data includes both revenue and orders by date.
        Provide insights about:
        1. Revenue trends
        2. Orders trends
        3. Any correlation between them
        4. Highlight spikes or drops
        
        Data: ${JSON.stringify(chartData)}
      `;

      const response = await getGeminiAnalysis(prompt);
    setAnalysis(response);
    setShowAnalysis(true);
    } catch (err) {
      setAnalysis("Error fetching analysis.");
      setShowAnalysis(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Analytics</CardTitle>
        <div className="flex items-center space-x-2">
          {/* Metric dropdown (for graph only) */}
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

          {/* AI Button */}
          <AIButton
            onClick={fetchAnalysis}
            loading={loading}
            tooltip="Get AI Analysis"
          />
        </div>
      </CardHeader>

      <CardContent>
        {showAnalysis ? (
          <div className="space-y-4">
            <p className="text-gray-700 whitespace-pre-line">{analysis}</p>
            <Button onClick={() => setShowAnalysis(false)} variant="outline">
              Back to Graph
            </Button>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {/* Only 1 line at a time depending on dropdown */}
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
