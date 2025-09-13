"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

export function AIButton({ 
  onClick, 
  loading = false, 
  size = "sm", 
  variant = "ghost",
  tooltip 
}) {
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={onClick}
      disabled={loading}
      className="rounded-full p-2 h-8 w-8"
      title={tooltip}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 text-purple-500" />
      )}
    </Button>
  );
}