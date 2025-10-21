"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation"; // added usePathname
import { ShoppingCart, User, LogOut, Palette, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/lib/store";
import { logout } from "@/lib/auth";

export function Navbar() {
  const { user, profile } = useAuth();
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const router = useRouter();
  const pathname = usePathname(); // current route for toggle active state

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

  const navLinks = (
    <div className="hidden md:flex items-center gap-2 rounded-full supports-[backdrop-filter]:bg-white/70 bg-white/90 px-2 py-1.5 border border-slate-200/70 shadow-sm backdrop-blur">
      {/* Segmented toggle: Products | Artisans */}
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-100/70 border border-slate-200/70">
        <Link
          href="/products"
          aria-current={isProducts ? "page" : undefined}
          className={`px-3.5 py-2 rounded-full text-[15px] sm:text-base font-semibold transition-colors ${
            isProducts
              ? "bg-white text-primary shadow-sm ring-1 ring-primary/20"
              : "text-slate-700 hover:text-primary"
          }`}
        >
          Products & Services
        </Link>
        <Link
          href="/artisans"
          aria-current={isArtisans ? "page" : undefined}
          className={`px-3.5 py-2 rounded-full text-[15px] sm:text-base font-semibold transition-colors ${
            isArtisans
              ? "bg-white text-primary shadow-sm ring-1 ring-primary/20"
              : "text-slate-700 hover:text-primary"
          }`}
        >
          Artisans
        </Link>
      </div>

      {/* Keep existing artisan-only links (no hover underline) */}
      {profile?.role === "artisan" && (
        <>
          <Link
            href={user?.uid ? `/artisan/${user.uid}` : "/artisan/profile"}
            className="px-3.5 py-2.5 rounded-full text-[15px] sm:text-base font-semibold text-slate-700 hover:text-primary hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all duration-200 ease-out hover:shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          >
            My Store
          </Link>
          <Link
            href="/artisan/dashboard"
            className="px-3.5 py-2.5 rounded-full text-[15px] sm:text-base font-semibold text-slate-700 hover:text-primary hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all duration-200 ease-out hover:shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          >
            Dashboard
          </Link>
        </>
      )}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 supports-[backdrop-filter]:bg-white/70 bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group" aria-label="Artivio home">
            <div className="h-10 w-10 grid place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-1 ring-primary/25 group-hover:from-primary/30 group-hover:to-primary/15 transition-colors">
              <Palette className="h-5 w-5" />
            </div>
            <span className="font-semibold text-xl sm:text-2xl tracking-tight text-slate-900 group-hover:text-slate-950 transition-colors">
              Artivio
            </span>
          </Link>

          {/* Desktop Nav */}
          {navLinks}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="relative inline-flex items-center justify-center h-11 w-11 rounded-full hover:bg-slate-50 text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Cart"
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
                  aria-label="Profile"
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
                  aria-label="Sign out"
                  title="Sign out"
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
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="rounded-full shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-primary/30 text-[15px] sm:text-base font-semibold">
                    Sign Up
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
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
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
            Products & Services
          </Link>

          {profile?.role === "artisan" ? (
            <Link
              href={user?.uid ? `/artisan/${user.uid}` : "/artisan/profile"}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setMobileOpen(false)}
            >
              My Store
            </Link>
          ) : (
            <Link
              href="/artisans"
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setMobileOpen(false)}
            >
              Artisans
            </Link>
          )}

          {profile?.role === "artisan" && (
            <Link
              href="/artisan/dashboard"
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setMobileOpen(false)}
            >
              Dashboard
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
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-base text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <LogOut className="h-5 w-5 text-slate-600" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-2">
                <Link href="/sign-in" className="flex-1">
                  <Button
                    variant="ghost"
                    className="w-full rounded-full hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary/30 text-base font-semibold"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" className="flex-1">
                  <Button className="w-full rounded-full shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-primary/30 text-base font-semibold">
                    Sign Up
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
