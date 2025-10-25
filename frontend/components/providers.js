"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/context/LanguageContext';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  return (
    <NextIntlClientProvider locale="en" messages={{}}>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </LanguageProvider>
    </NextIntlClientProvider>
  );
}