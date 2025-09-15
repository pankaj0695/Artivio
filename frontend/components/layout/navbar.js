"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useCartStore } from '@/lib/store';
import { logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, LogOut, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, profile } = useAuth();
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Palette className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl text-primary">Artivio</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/products" className="text-gray-700 hover:text-primary transition-colors">
              Products
            </Link>
            {profile?.role === 'artisan' && (
              <Link href="/artisan/dashboard" className="text-gray-700 hover:text-primary transition-colors">
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/cart" className="relative">
                  <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-primary transition-colors" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </Link>
                <Link href="/profile">
                  <User className="h-6 w-6 text-gray-700 hover:text-primary transition-colors" />
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}