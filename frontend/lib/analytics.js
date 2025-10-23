"use client";

import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import {
  getAnalytics,
  isSupported as analyticsIsSupported,
  logEvent,
} from "firebase/analytics";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  increment,
} from "firebase/firestore";

// --- Internal utils --------------------------------------------------------
const isBrowser = () => typeof window !== "undefined";

let analyticsInstance = null;

export async function getAnalyticsInstance() {
  if (!isBrowser()) return null;
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return null; // analytics needs measurementId
  try {
    const supported = await analyticsIsSupported();
    if (!supported) return null;
    if (!analyticsInstance) {
      analyticsInstance = getAnalytics();
    }
    return analyticsInstance;
  } catch (e) {
    // Graceful no-op if unsupported (e.g. Safari ITP in some contexts)
    console.warn("Analytics not available:", e?.message || e);
    return null;
  }
}

export async function logPageView({ title, path, location }) {
  const analytics = await getAnalyticsInstance();
  if (!analytics) return;
  try {
    logEvent(analytics, "page_view", {
      page_title: title || document.title || "",
      page_location: location || window.location.href,
      page_path: path || window.location.pathname,
    });
  } catch (e) {
    console.warn("Failed to log page_view:", e);
  }
}

// Generate a stable visitor id stored in localStorage
export function ensureVisitorId() {
  if (!isBrowser()) return "server";
  try {
    const key = "artivio:visitorId";
    let vid = localStorage.getItem(key);
    if (!vid) {
      if (window.crypto?.randomUUID) {
        vid = window.crypto.randomUUID();
      } else {
        vid = `v_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      }
      localStorage.setItem(key, vid);
    }
    return vid;
  } catch {
    return `anon_${Date.now()}`;
  }
}

function pathKey(pathname) {
  // Firestore doc ids cannot contain forward slashes; encode path safely
  try {
    return encodeURIComponent(pathname || "/");
  } catch {
    return "root";
  }
}

// Increment total view counter and optionally set a friendly page name
export async function trackPageView(pathname, { title } = {}) {
  try {
    const key = pathKey(pathname);
    const ref = doc(db, "pageStats", key);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        tx.set(ref, {
          path: pathname,
          totalViews: 1,
          uniqueVisitors: 0,
          pageName: title || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastVisitedAt: serverTimestamp(),
        });
      } else {
        const updates = {
          totalViews: increment(1),
          updatedAt: serverTimestamp(),
          lastVisitedAt: serverTimestamp(),
        };
        if (title && !snap.data().pageName) {
          updates.pageName = title;
        }
        tx.update(ref, updates);
      }
    });
  } catch (e) {
    console.warn("trackPageView failed:", e);
  }
}

// Track unique visitors per path using a per-path subcollection
export async function trackUniquePageVisitor(pathname, extra = {}) {
  if (!isBrowser()) return { counted: false };
  const visitorId = ensureVisitorId();
  const user = getAuth()?.currentUser || null;
  const key = pathKey(pathname);

  const statsRef = doc(db, "pageStats", key);
  const visitorRef = doc(db, "pageStats", key, "visitors", visitorId);

  try {
    await runTransaction(db, async (tx) => {
      const visitorSnap = await tx.get(visitorRef);
      if (visitorSnap.exists()) return; // already counted

      // mark visitor
      tx.set(visitorRef, {
        visitedAt: serverTimestamp(),
        path: pathname,
        visitorId,
        userId: user?.uid || null,
        ...extra,
      });

      const statsSnap = await tx.get(statsRef);
      if (!statsSnap.exists()) {
        tx.set(statsRef, {
          path: pathname,
          uniqueVisitors: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.update(statsRef, {
          uniqueVisitors: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
    });
    return { counted: true };
  } catch (e) {
    console.warn("trackUniquePageVisitor failed:", e);
    return { counted: false, error: e?.message || String(e) };
  }
}

export async function getUniqueVisitorsForPath(pathname) {
  try {
    const key = pathKey(pathname);
    const snap = await getDoc(doc(db, "pageStats", key));
    return snap.exists() ? snap.data().uniqueVisitors || 0 : 0;
  } catch (e) {
    console.warn("getUniqueVisitorsForPath failed:", e);
    return 0;
  }
}

// Convenience for product page: "/products/[id]"
export async function getProductUniqueVisitors(productId) {
  const path = `/products/${productId}`;
  return getUniqueVisitorsForPath(path);
}

// Set or update a friendly label for a path (e.g., product title)
export async function setPageLabel(pathname, label) {
  try {
    const key = pathKey(pathname);
    const ref = doc(db, "pageStats", key);
    await setDoc(
      ref,
      {
        path: pathname,
        pageName: label,
        updatedAt: serverTimestamp(),
        // keep counters as-is if doc exists
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("setPageLabel failed:", e);
  }
}

export async function labelProductPage(productId, productTitle) {
  const pathname = `/products/${productId}`;
  await setPageLabel(pathname, productTitle);
  // Optionally also emit an analytics event with the specific title
  const analytics = await getAnalyticsInstance();
  if (analytics) {
    try {
      logEvent(analytics, "page_view", {
        page_title: productTitle,
        page_path: pathname,
        page_location:
          typeof window !== "undefined"
            ? `${window.location.origin}${pathname}`
            : pathname,
      });
    } catch (e) {
      console.warn("labelProductPage logEvent failed:", e);
    }
  }
}

// --- Stats getters ---------------------------------------------------------
export async function getPageStatsForPath(pathname) {
  try {
    const key = pathKey(pathname);
    const snap = await getDoc(doc(db, "pageStats", key));
    if (!snap.exists())
      return { totalViews: 0, uniqueVisitors: 0, pageName: null };
    const data = snap.data() || {};
    return {
      totalViews: data.totalViews || 0,
      uniqueVisitors: data.uniqueVisitors || 0,
      pageName: data.pageName || null,
    };
  } catch (e) {
    console.warn("getPageStatsForPath failed:", e);
    return { totalViews: 0, uniqueVisitors: 0, pageName: null };
  }
}

export async function getProductViewsStats(productId) {
  const pathname = `/products/${productId}`;
  return getPageStatsForPath(pathname);
}
