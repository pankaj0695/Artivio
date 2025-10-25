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
import { AIButton } from "@/components/ai/ai-button";
import { getGeminiAnalysis } from "@/lib/gemini";
import { ArrowLeft } from "lucide-react";
import { useStaticTranslation } from "@/lib/use-static-translation";

function RevenueOrdersChart({ orders }) {
  const { t } = useStaticTranslation();
  const [metric, setMetric] = useState("revenue");
  const [duration, setDuration] = useState("15");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  // Group and sort orders by day
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
        map.set(day, {
          date: day,
          revenue: 0,
          orders: 0,
          actualDate: date,
        });
      }
      const entry = map.get(day);
      entry.revenue += order.amount || 0;
      entry.orders += 1;
    });

    let dataArr = Array.from(map.values());

    // ✅ Ensure oldest → newest so latest is at right
    dataArr.sort((a, b) => a.actualDate - b.actualDate);

    return dataArr.slice(-Number(duration));
  }, [orders, duration]);

  // Gemini API call
  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `
        Analyze the following business data for the last ${duration} days.
        Data includes both revenue and orders by date.
        Provide clear, short, and simple insights under 200 words.
        Avoid bold formatting or markdown symbols.
        Focus only on explaining trends, spikes, drops, and correlation
        in easy language suitable for direct website display.
        
        Data: ${JSON.stringify(chartData)}
      `;

      const response = await getGeminiAnalysis(prompt);
      setAnalysis(response);
      setShowAnalysis(true);
    } catch (err) {
      setAnalysis(t("analytics.errorFetchingAnalysis"));
      setShowAnalysis(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("analytics.title")}</CardTitle>
        <div className="flex items-center space-x-2">
          {/* Metric dropdown (for graph only) */}
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t("analytics.metric")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">{t("analytics.revenue")}</SelectItem>
              <SelectItem value="orders">{t("analytics.orders")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Duration dropdown */}
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t("analytics.duration")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">{t("analytics.last15Days")}</SelectItem>
              <SelectItem value="30">{t("analytics.last30Days")}</SelectItem>
            </SelectContent>
          </Select>

          {/* AI Button */}
          <AIButton
            onClick={fetchAnalysis}
            loading={loading}
            tooltip={t("analytics.explainWithAI")}
          />
        </div>
      </CardHeader>

      <CardContent>
        {showAnalysis ? (
          <div className="relative w-full h-[300px] border rounded-lg p-4 bg-gray-50">
            {/* Back Arrow with tooltip */}
            <button
              onClick={() => setShowAnalysis(false)}
              className="absolute top-2 left-2 text-gray-600 hover:text-black"
              title={t("analytics.backToChart")}
            >
              <ArrowLeft size={20} />
            </button>

            {/* Scrollable analysis text with top padding to avoid overlap */}
            <div className="h-full overflow-y-auto pr-2 pt-8">
              <p className="text-gray-700 text-sm whitespace-pre-line">
                {analysis}
              </p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
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
          <p className="text-gray-500 text-center py-8">{t("analytics.noData")}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default RevenueOrdersChart;
