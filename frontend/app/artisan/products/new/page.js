"use client";

import { RoleGuard } from '@/components/auth/role-guard';
import { ProductForm } from '@/components/artisan/product-form';
import { Card, CardContent } from "@/components/ui/card";

function NewProductContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="mb-2">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Add New Product</h1>
        <p className="text-gray-600">Create a new product listing with AI-powered assistance</p>
      </div>

      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="product-form-theme">
            <ProductForm />
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        .product-form-theme button[type="submit"],
        .product-form-theme .btn-submit,
        .product-form-theme [data-role="submit"] {
          background-color: #000 !important;
          color: #fff !important;
          border-radius: 9999px !important;
          transition: background-color .2s ease, transform .05s ease, box-shadow .2s ease !important;
        }
        .product-form-theme button[type="submit"]:hover,
        .product-form-theme .btn-submit:hover,
        .product-form-theme [data-role="submit"]:hover {
          background-color: rgba(0,0,0,.9) !important;
        }
        .product-form-theme button[type="submit"]:active,
        .product-form-theme .btn-submit:active,
        .product-form-theme [data-role="submit"]:active {
          background-color: rgba(0,0,0,.8) !important;
          transform: translateY(0.5px) scale(.99);
        }
        .product-form-theme button[type="submit"]:focus-visible,
        .product-form-theme .btn-submit:focus-visible,
        .product-form-theme [data-role="submit"]:focus-visible {
          outline: none !important;
          box-shadow: 0 0 0 2px #000, 0 0 0 4px #fff !important;
        }
        .product-form-theme button[type="submit"][disabled],
        .product-form-theme .btn-submit[disabled],
        .product-form-theme [data-role="submit"][disabled] {
          opacity: .6;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <RoleGuard requiredRole="artisan">
      <NewProductContent />
    </RoleGuard>
  );
}