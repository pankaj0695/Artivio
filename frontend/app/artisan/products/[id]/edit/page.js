"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/auth/role-guard";
import { ProductForm } from "@/components/artisan/product-form";
import { getProduct } from "@/lib/firestore";

function EditProductContent() {
  const params = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => getProduct(params.id),
  });

  if (isLoading) return <div className="p-12">Loading...</div>;
  if (!data?.product) return <div className="p-12">Product not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Edit Product</h1>
      <ProductForm product={data.product} isEdit />
    </div>
  );
}

export default function EditProductPage() {
  return (
    <RoleGuard requiredRole="artisan">
      <EditProductContent />
    </RoleGuard>
  );
}
