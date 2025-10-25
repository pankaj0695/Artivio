"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Users, Palette } from "lucide-react";
import { useStaticTranslation } from "@/lib/use-static-translation";

export default function HomePage() {
  const { t } = useStaticTranslation();
  const featuredProducts = [
    {
      id: 1,
      title: "Handcrafted Ceramic Vase",
      price: 2999,
      image:
        "https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg",
      artisan: "Maya Ceramics",
      rating: 4.8,
    },
    {
      id: 2,
      title: "Woven Silk Scarf",
      price: 1899,
      image:
        "https://images.pexels.com/photos/1040173/pexels-photo-1040173.jpeg",
      artisan: "Textile Traditions",
      rating: 4.9,
    },
    {
      id: 3,
      title: "Brass Jewelry Set",
      price: 3499,
      image:
        "https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg",
      artisan: "Heritage Crafts",
      rating: 4.7,
    },
  ];

  const categories = [
    { name: t("categories.pottery"), icon: "🏺", count: t("home.potteryCount") },
    { name: t("categories.textiles"), icon: "🧵", count: t("home.textilesCount") },
    { name: t("categories.jewelry"), icon: "💍", count: t("home.jewelryCount") },
    { name: t("categories.woodwork"), icon: "🪵", count: t("home.woodworkCount") },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 overflow-hidden">
        {/* decorative glow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-black rounded-full px-4 py-2">
                  {t("home.badge")}
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-black leading-tight">
                  {t("home.heading")}
                </h1>
                <p className="text-xl text-black leading-relaxed">
                  {t("home.description")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button
                    size="lg"
  className="rounded-full px-8 py-6 text-lg bg-black text-white border border-black/20 shadow-sm 
             hover:bg-white hover:text-black hover:shadow-lg hover:-translate-y-1 
             active:translate-y-0 focus-visible:ring-2 focus-visible:ring-black/20 
             transition-all duration-300 ease-in-out"              >
                    {t("home.shopNow")}
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    variant="outline"
                    size="lg"
className="rounded-full px-8 py-6 text-lg bg-black text-white border border-black/20 shadow-sm 
             hover:bg-white hover:text-black hover:shadow-lg hover:-translate-y-1 
             active:translate-y-0 focus-visible:ring-2 focus-visible:ring-black/20 
             transition-all duration-300 ease-in-out"                  >
                    {t("home.becomeArtisan")}
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-8 pt-4 rounded-xl bg-white/60 supports-[backdrop-filter]:bg-white/50 backdrop-blur px-4 py-3 ring-1 ring-white/60 shadow-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">500+</div>
                  <div className="text-black">{t("home.artisansCount")}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">2,000+</div>
                  <div className="text-black">{t("home.productsCount")}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">4.9</div>
                  <div className="text-black">{t("home.ratingLabel")}</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Card className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-white/50 ring-1 ring-slate-200/70 hover:ring-slate-300">
                    <div className="aspect-[4/5]">
                      <Image
                        src="https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg"
                        alt="Artisan craft"
                        fill
                        sizes="(max-width: 1024px) 100vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  </Card>
                  <Card className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-white/50 ring-1 ring-slate-200/70 hover:ring-slate-300">
                    <div className="aspect-[4/5]">
                      <Image
                        src="https://images.pexels.com/photos/1040173/pexels-photo-1040173.jpeg"
                        alt="Artisan craft"
                        fill
                        sizes="(max-width: 1024px) 100vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  </Card>
                </div>
                <div className="space-y-4">
                  <Card className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-white/50 ring-1 ring-slate-200/70 hover:ring-slate-300">
                    <div className="aspect-[4/5]">
                      <Image
                        src="https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg"
                        alt="Artisan craft"
                        fill
                        sizes="(max-width: 1024px) 100vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  </Card>
                  <Card className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-white/50 ring-1 ring-slate-200/70 hover:ring-slate-300">
                    <div className="aspect-[4/5]">
                      <Image
                        src="https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg"
                        alt="Artisan craft"
                        fill
                        sizes="(max-width: 1024px) 100vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* section divider */}
      <div aria-hidden="true" className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">

            <h2 className="text-4xl font-bold text-black mb-3 tracking-tight">
              {t("home.browseCategories")}
            </h2>
            <p className="text-lg text-black max-w-2xl mx-auto">
              {t("home.browseDescription")}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${category.name.toLowerCase()}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-2xl"
              >
                <Card className="group rounded-2xl border border-slate-200/70 ring-1 ring-transparent hover:ring-primary/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200/70">
                      <span className="text-2xl"> {category.icon} </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 text-black">
                      {category.name}
                    </h3>
                    <p className="text-black text-sm">{category.count}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* section divider */}
      <div aria-hidden="true" className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
 
            <h2 className="text-4xl font-bold text-black mb-3 tracking-tight">
              {t("home.featuredProducts")}
            </h2>
            <p className="text-lg text-black max-w-2xl mx-auto">
              {t("home.featuredDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="group rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* subtle overlay on hover */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="rounded-full text-black">
                      {product.artisan}
                    </Badge>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium text-black">
                        {product.rating}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 min-h-[48px] text-black">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-black">
                      ₹{product.price}
                    </span>
                    <Button
                      size="sm"
                      className="rounded-full bg-white text-black border border-black/15 hover:bg-neutral-50 hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-black/20 transition-all"
                    >
                      {t("products.viewDetails")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/products">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 bg-white text-black border border-black/20 hover:bg-neutral-50 hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-black/20 transition-all"
              >
                {t("home.viewAllProducts")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* section divider */}
      <div aria-hidden="true" className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Why Artivio */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">

            <h2 className="text-4xl font-bold text-black tracking-tight">
              {t("home.whyArtivio")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="rounded-2xl p-6 w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 ring-1 ring-blue-200/60 shadow-sm">
                <Palette className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-black">
                {t("home.aiPowered")}
              </h3>
              <p className="text-black">
                {t("home.aiPoweredDesc")}
              </p>
            </div>
            <div className="rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="rounded-2xl p-6 w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 ring-1 ring-blue-200/60 shadow-sm">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-black">
                {t("home.directFromArtisans")}
              </h3>
              <p className="text-black">
                {t("home.directDesc")}
              </p>
            </div>
            <div className="rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="rounded-2xl p-6 w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50 ring-1 ring-green-200/60 shadow-sm">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-black">
                {t("home.qualityGuaranteed")}
              </h3>
              <p className="text-black">
                {t("home.qualityDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
