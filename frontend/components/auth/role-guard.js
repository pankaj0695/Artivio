"use client";

import { useAuth } from '@/hooks/use-auth';
import { LoadingPage } from '@/components/ui/loading';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RoleGuard({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/sign-in');
        return;
      }
      
      if (requiredRole && profile?.role !== requiredRole) {
        router.push('/');
        return;
      }
    }
  }, [user, profile, loading, requiredRole, router]);

  if (loading) {
    return <LoadingPage />;
  }

  if (!user || (requiredRole && profile?.role !== requiredRole)) {
    return null;
  }

  return children;
}