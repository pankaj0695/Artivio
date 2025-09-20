"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/firestore";
import { Search, Eye, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { getArtisanPublic } from "@/lib/firestore"; 
import { useEffect } from "react";


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
          avatar: artisanProfile?.avatar || "/default-avatar.png",
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Artisan Marketplace
      </h1>

      {/* Container for all three sections */}
      <div className="flex justify-center gap-8">

        {/* Left Sidebar Filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6 bg-white p-6 rounded-2xl shadow-sm border">
            {/* Search */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">Search</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-full"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">Category</h2>
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
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">Type</h2>
              <Select onValueChange={setListingType} value={listingType}>
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Listing Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">Sort By</h2>
              <Select onValueChange={setSortBy} value={sortBy}>
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

  
<div className="flex-1 w-full flex justify-center">
  {isLoading ? (
    <div className="flex flex-wrap justify-center gap-6">
      {Array(3)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 animate-pulse rounded-xl h-52 w-[32rem]" // increased height and width
          />
        ))}
    </div>
  ) : (
    <div className="flex flex-col items-center gap-6 w-full max-w-[32rem]"> {/* increased max width */}
      {filteredAndSortedProducts.map((product) => {
        const isInCart = items.some((item) => item.id === product.id);
        return (
          <Card
            key={product.id}
            className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 w-[32rem]" // increased width
          >
            <CardContent className="p-6 space-y-4">
              {/* Artisan Info */}
<div className="flex items-center gap-3 mb-3">
  <Link href={`/artisan/${product.artisanId}`} className="flex items-center gap-2 cursor-pointer">
  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-primary">
    <Image
      src={artisansMap[product.artisanId]?.avatar || "/default-avatar.png"}
      alt={artisansMap[product.artisanId]?.name || "Unknown Artisan"}
      width={40}
      height={40}
      className="object-cover"
    />
  </div>
  <div className="flex flex-col">
    <span className="font-semibold text-gray-900 text-sm">
      {artisansMap[product.artisanId]?.name || "Unknown Artisan"}
    </span>
    <span className="text-xs text-gray-500">Seller</span>
  </div>
</Link>
</div>


              {/* Product Image */}
              <div className="relative w-full aspect-[1/0.9] rounded-md overflow-hidden"> {/* slightly taller image */}
                <Image
                  src={product.images?.[0] || "/placeholder.png"}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 left-2">
                  <Badge className="text-xs px-2 py-1">
                    {product.type || "Product"}
                  </Badge>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 text-base line-clamp-2">
                  {product.title}
                </h3>
                <p className="text-gray-600 text-xs line-clamp-3">
                  {product.description}
                </p>
                <div className="font-bold text-sm text-primary">
                  ₹{product.price}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/products/${product.id}`}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    className="w-full rounded-full text-xs flex items-center justify-center gap-2 py-2.5"
                  >
                    <Eye className="h-4 w-4" /> View
                  </Button>
                </Link>
                <Button
                  onClick={() => handleToggleCart(product)}
                  className="flex-1 rounded-full text-xs flex items-center justify-center gap-2 py-2.5 bg-primary text-white hover:bg-primary/90"
                >
                  <ShoppingCart className="h-4 w-4" />{" "}
                  {isInCart ? "Remove" : "Add"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  )}
</div>

        {/* Right News Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-4 bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="font-semibold text-gray-800 mb-3">Latest News</h2>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  New artisan marketplace feature launched!
                </p>
                <span className="text-xs text-gray-500">Sep 20, 2025</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  Exclusive pottery workshop coming this week.
                </p>
                <span className="text-xs text-gray-500">Sep 18, 2025</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  Jewelry artisans now verified with badges.
                </p>
                <span className="text-xs text-gray-500">Sep 15, 2025</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
