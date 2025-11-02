"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProducts, getArtisanPublic } from "@/lib/firestore";
import { Search } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { useStaticTranslation } from "@/lib/use-static-translation";
import { useLanguage } from "@/context/LanguageContext";
import { ProductCard } from "@/components/products/product-card";

function isValidImageSrc(src) {
  return typeof src === "string" && (src.startsWith("/") || src.startsWith("http"));
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "pottery", label: "Pottery" },
  { value: "textiles", label: "Textiles" },
  { value: "jewelry", label: "Jewelry" },
  { value: "woodwork", label: "Woodwork" },
  { value: "metalwork", label: "Metalwork" },
  { value: "painting", label: "Painting" },
  { value: "sculpture", label: "Sculpture" },
  { value: "other", label: "Other" },
];

export default function ProductsPage() {
  const { t } = useStaticTranslation();
  const { language } = useLanguage();
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [listingType, setListingType] = useState("all");

  const [artisansMap, setArtisansMap] = useState({});

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", selectedCategory],
    queryFn: () =>
      getProducts({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        status: "active",
      }),
  });

  useEffect(() => {
    if (!productsData?.products) return;

    (async () => {
      const map = {};
      for (const product of productsData.products) {
        if (!map[product.artisanId]) {
          const artisanProfile = await getArtisanPublic(product.artisanId);
          map[product.artisanId] = {
            name: artisanProfile?.displayName || "Unknown Artisan",
            avatar: isValidImageSrc(artisanProfile?.avatar)
              ? artisanProfile.avatar
              : "/default-avatar.png",
          };
        }
      }
      setArtisansMap(map);
    })();
  }, [productsData]);

  const filteredAndSortedProducts =
    productsData?.products
      ?.filter((product) => {
        const t = product.type || "product";
        if (listingType === "all") return true;
        if (listingType === "service") return t === "service";
        return t !== "service";
      })
      ?.filter(
        (product) =>
          product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return a.price - b.price;
          case "price-high":
            return b.price - a.price;
          case "newest":
          default:
            return (
              new Date(b.createdAt?.seconds * 1000) -
              new Date(a.createdAt?.seconds * 1000)
            );
        }
      }) || [];

  const handleToggleCart = (product) => {
    const isInCart = items.some((item) => item.id === product.id);
    if (isInCart) {
      removeItem(product.id);
      toast.error(`${product.title} removed from cart`);
    } else {
      addItem(product);
      toast.success(`${product.title} added to cart`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-center gap-8">
        {/* Left Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6 bg-white p-6 rounded-2xl shadow-sm border">
            {/* Search */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">
                {t("products.search")}
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder={t("products.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-full"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">
                {t("products.category")}
              </h2>
              <Select
                onValueChange={setSelectedCategory}
                value={selectedCategory}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {t(
                        `categories.${
                          category.value === "all"
                            ? "allCategories"
                            : category.value
                        }`
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">
                {t("products.type")}
              </h2>
              <Select onValueChange={setListingType} value={listingType}>
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Listing Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("products.typeAll")}</SelectItem>
                  <SelectItem value="product">{t("products.typeProduct")}</SelectItem>
                  <SelectItem value="service">{t("products.typeService")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">
                {t("products.sortBy")}
              </h2>
              <Select onValueChange={setSortBy} value={sortBy}>
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("products.sortNewest")}</SelectItem>
                  <SelectItem value="price-low">{t("products.sortPriceLow")}</SelectItem>
                  <SelectItem value="price-high">{t("products.sortPriceHigh")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Products Section */}
        <div className="flex-1 w-full flex justify-center">
          {isLoading ? (
            <div className="flex flex-wrap justify-center gap-6">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 animate-pulse rounded-xl h-52 w-[32rem]"
                  />
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 w-full max-w-[32rem]">
              {filteredAndSortedProducts.map((product) => {
                const isInCart = items.some((item) => item.id === product.id);

                const safeProduct = {
                  ...product,
                  images: Array.isArray(product.images)
                    ? product.images.map((img) =>
                        isValidImageSrc(img) ? img : "/placeholder.png"
                      )
                    : ["/placeholder.png"],
                };

                const hasNFT = Boolean(safeProduct.artisanWallet);

                return (
                  <div key={safeProduct.id} className="relative w-full">
                    {hasNFT && (
                      <span className="absolute top-2 right-3 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm border border-green-200">
                        🪙 Authorized & Owned by Artisan
                      </span>
                    )}
                    <ProductCard
                      product={safeProduct}
                      artisanInfo={artisansMap[safeProduct.artisanId]}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right News Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-4 bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="font-semibold text-gray-800 mb-3">
              {t("products.latestNews")}
            </h2>
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {t(`products.news${n}`)}
                  </p>
                  <span className="text-xs text-gray-500">
                    {t(`products.news${n}Date`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
