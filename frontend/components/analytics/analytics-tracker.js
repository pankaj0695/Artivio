"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  logPageView,
  trackUniquePageVisitor,
  trackPageView,
} from "@/lib/analytics";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const title = document?.title || "";
    const location =
      typeof window !== "undefined" ? window.location.href : undefined;
    logPageView({
      title,
      path: pathname + (searchParams?.toString() ? `?${searchParams}` : ""),
      location,
    });
    // Increment total views for this path
    trackPageView(pathname, { title });
    // Track unique visitor per pathname (not including query)
    trackUniquePageVisitor(pathname);
  }, [pathname, searchParams]);

  return null;
}
