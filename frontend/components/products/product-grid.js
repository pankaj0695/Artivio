import { ProductCard } from './product-card';
import { useStaticTranslation } from '@/lib/use-static-translation';

export function ProductGrid({ products, loading }) {
  const { t } = useStaticTranslation();
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-2xl aspect-[3/4]" />
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">{t("productGrid.noProductsFound")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}