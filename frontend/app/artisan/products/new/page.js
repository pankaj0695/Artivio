"use client";

import { RoleGuard } from '@/components/auth/role-guard';
import { ProductForm } from '@/components/artisan/product-form';

function NewProductContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Add New Product</h1>
        <p className="text-gray-600">Create a new product listing with AI-powered assistance</p>
      </div>
      
      <ProductForm />
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