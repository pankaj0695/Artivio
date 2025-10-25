"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, User, LogOut, Palette, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/lib/store";
import { logout } from "@/lib/auth";
import { motion } from "framer-motion";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useStaticTranslation } from "@/lib/use-static-translation";

export function Navbar() {
  const { user, profile } = useAuth();
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const router = useRouter();
  const pathname = usePathname(); // current route for toggle active state
  const { t } = useStaticTranslation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // client-only values to avoid SSR hydration issues
  const [mounted, setMounted] = useState(false);
  const [clientTotal, setClientTotal] = useState(0);

  useEffect(() => {
    setMounted(true);
    try {
      const initial = typeof getTotalItems === "function" ? Number(getTotalItems()) || 0 : 0;
      setClientTotal(initial);
    } catch {
      setClientTotal(0);
    }
  }, []); // UI-only: do not change business logic

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push("/");
    }
  };

  // reset image error when photoURL changes
  useEffect(() => {
    setImageError(false);
  }, [profile?.photoURL]);

  const isProducts = pathname?.startsWith("/products");
  const isArtisans = pathname?.startsWith("/artisans");

  // Build tabs (includes My Store/Dashboard when artisan)
  const myStoreHref = user?.uid ? `/artisan/${user.uid}` : "/artisan/profile";
  const tabs = [
    { key: "home", label: t("navbar.home"), href: "/" },
    { key: "products", label: t("navbar.productsServices"), href: "/products" },
    { key: "artisans", label: t("navbar.artisans"), href: "/artisans" },
    ...(profile?.role === "artisan"
      ? [
          { key: "store", label: t("navbar.myStore"), href: myStoreHref },
          { key: "dashboard", label: t("navbar.dashboard"), href: "/artisan/dashboard" },
        ]
      : [{ key: "profile", label: t("navbar.profile"), href: "/profile" }]),
  ];

  const isActiveTab = (href) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  // Sliding pill: measure active tab inside the toggle container
  const containerRef = useRef(null);
  const tabRefs = useRef({});
  const [pill, setPill] = useState({ left: 0, width: 0, height: 0 });

  const activeKey = (tabs.find((t) => isActiveTab(t.href))?.key) || tabs[0]?.key;

  const updatePill = () => {
    const container = containerRef.current;
    const el = tabRefs.current[activeKey];
    if (!container || !el) return;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPill({
      left: r.left - c.left,
      width: r.width,
      height: r.height,
    });
  };

  useEffect(() => {
    updatePill();
  }, [pathname, tabs.length, mounted]);

  useEffect(() => {
    const onResize = () => updatePill();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navLinks = (
    <div className="hidden md:flex items-center gap-3">
      {/* Slide toggle with animated pill (constrained to this container) */}
      <div
        ref={containerRef}
        className="relative inline-flex items-center gap-1 p-1 rounded-full supports-[backdrop-filter]:bg-white/70 bg-white/90 border border-slate-200/70 shadow-sm backdrop-blur"
      >
        {/* Single animated pill */}
        <motion.span
          className="absolute rounded-full bg-black"
          style={{ top: 4, bottom: 4 }}
          animate={{ left: pill.left + 4, width: Math.max(0, pill.width - 8) }}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="relative inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <span
                ref={(el) => (tabRefs.current[tab.key] = el)}
                className={`relative z-10 px-3.5 py-2 rounded-full text-[15px] sm:text-base font-semibold transition-colors ${
                  active ? "text-white" : "text-slate-700 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 supports-[backdrop-filter]:bg-white/70 bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group" aria-label={t("navbar.brandHome")}>
            <div className="h-10 w-10 grid place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-1 ring-primary/25 group-hover:from-primary/30 group-hover:to-primary/15 transition-colors">
              <Palette className="h-5 w-5" />
            </div>
            <span className="font-semibold text-xl sm:text-2xl tracking-tight text-slate-900 group-hover:text-slate-950 transition-colors">
              {t("navbar.brand")}
            </span>
          </Link>

          {/* Desktop Nav */}
          {navLinks}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher />

            <Link
              href="/cart"
              className="relative inline-flex items-center justify-center h-11 w-11 rounded-full hover:bg-slate-50 text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={t("navbar.cart")}
            >
              <ShoppingCart className="h-5 w-5" />

              {/* Always render the badge element to keep DOM stable.
                 Use suppressHydrationWarning to avoid text mismatches. */}
              <span
                suppressHydrationWarning
                className={`absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-primary text-white text-[11px] font-semibold grid place-items-center shadow-sm transition-all duration-200 ${
                  mounted && clientTotal > 0 ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
                aria-hidden={!(mounted && clientTotal > 0)}
              >
                {mounted && clientTotal > 0 ? clientTotal : ""}
              </span>
            </Link>

            {user ? (
              <>
                <Link
                  href="/profile"
                  className="h-11 w-11 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 hover:border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label={t("navbar.profile")}
                >
                  {/* Keep nodes stable; toggle visibility only */}
                  <img
                    src={profile?.photoURL || ""}
                    alt="Profile"
                    width={44}
                    height={44}
                    className={`object-cover h-11 w-11 ${profile?.photoURL && !imageError ? "block" : "hidden"}`}
                    onError={() => setImageError(true)}
                  />
                  <User
                    className={`h-5 w-5 text-slate-600 ${profile?.photoURL && !imageError ? "hidden" : "block"}`}
                  />
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary/30"
                  onClick={handleLogout}
                  aria-label={t("navbar.signOut")}
                  title={t("navbar.signOut")}
                >
                  <LogOut className="h-5 w-5 text-slate-700" />
                </Button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    className="rounded-full hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary/30 text-[15px] sm:text-base font-semibold"
                  >
                    {t("navbar.signIn")}
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="rounded-full shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-primary/30 text-[15px] sm:text-base font-semibold">
                    {t("navbar.signUp")}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center h-11 w-11 rounded-full text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((s) => !s)}
              aria-label={mobileOpen ? t("navbar.closeMenu") : t("navbar.openMenu")}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden border-t border-slate-200/70 supports-[backdrop-filter]:bg-white/70 bg-white/90 backdrop-blur transition-[max-height,opacity] duration-300 ${
          mobileOpen ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pt-3 pb-4 space-y-1">
          <Link
            href="/products"
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={() => setMobileOpen(false)}
          >
            {t("navbar.productsServices")}
          </Link>

          {profile?.role === "artisan" ? (
            <Link
              href={user?.uid ? `/artisan/${user.uid}` : "/artisan/profile"}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setMobileOpen(false)}
            >
              {t("navbar.myStore")}
            </Link>
          ) : (
            <Link
              href="/artisans"
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setMobileOpen(false)}
            >
              {t("navbar.artisans")}
            </Link>
          )}

          {profile?.role === "artisan" && (
            <Link
              href="/artisan/dashboard"
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setMobileOpen(false)}
            >
              {t("navbar.dashboard")}
            </Link>
          )}

          <div className="pt-3 mt-2 border-t border-slate-200/70">
            {user ? (
              <div className="space-y-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-base text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="h-5 w-5 text-slate-600" />
                  <span>{t("navbar.profile")}</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-base text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <LogOut className="h-5 w-5 text-slate-600" />
                  <span>{t("navbar.signOut")}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-2">
                <Link href="/sign-in" className="flex-1">
                  <Button
                    variant="ghost"
                    className="w-full rounded-full hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary/30 text-base font-semibold"
                  >
                    {t("navbar.signIn")}
                  </Button>
                </Link>
                <Link href="/sign-up" className="flex-1">
                  <Button className="w-full rounded-full shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-primary/30 text-base font-semibold">
                    {t("navbar.signUp")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
