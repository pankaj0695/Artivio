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
import { ProductGrid } from "@/components/products/product-grid";
import { getProducts } from "@/lib/firestore";
import { Search } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [listingType, setListingType] = useState("all"); // all | product | service

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", selectedCategory],
    queryFn: () =>
      getProducts({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        status: "active",
      }),
  });

  const filteredAndSortedProducts =
    productsData?.products
      ?.filter((p) => {
        const t = p.type || "product";
        if (listingType === "all") return true;
        if (listingType === "service") return t === "service";
        return t !== "service"; // product
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Artisan Crafts
        </h1>
        <p className="text-xl text-gray-600">
          Explore our collection of handcrafted items from talented artisans
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>

          <Select onValueChange={setSelectedCategory} value={selectedCategory}>
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

          <Select onValueChange={setListingType} value={listingType}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="Listings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Listings</SelectItem>
              <SelectItem value="product">Products</SelectItem>
              <SelectItem value="service">Services</SelectItem>
            </SelectContent>
          </Select>

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

      {/* Results count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {isLoading
            ? "Loading..."
            : `${filteredAndSortedProducts.length} ${
                listingType === "all"
                  ? "listings"
                  : listingType === "service"
                  ? "services"
                  : "products"
              } found`}
        </p>
      </div>

      {/* Products Grid */}
      <ProductGrid products={filteredAndSortedProducts} loading={isLoading} />
    </div>
  );
}
