"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductViewsStats } from "@/lib/analytics";
import { Eye } from "lucide-react";

export function ViewsBadge({ productId, showUnique = false, className = "" }) {
  const { data } = useQuery({
    queryKey: ["views-stats", productId],
    queryFn: () => getProductViewsStats(productId),
    enabled: !!productId,
    staleTime: 60_000,
  });

  const total = data?.totalViews ?? 0;
  const unique = data?.uniqueVisitors ?? 0;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 ${className}`}
      title={
        showUnique ? `${total} views • ${unique} unique` : `${total} views`
      }
    >
      <Eye className="h-3.5 w-3.5" />
      {total}
      {showUnique && (
        <span className="text-[10px] text-gray-500">• {unique}u</span>
      )}
    </span>
  );
}
