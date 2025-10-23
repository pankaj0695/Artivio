"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/ui/loading";
import { useCartStore } from "@/lib/store";
import { getProduct } from "@/lib/firestore";
import { Star, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { labelProductPage } from "@/lib/analytics";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => getProduct(params.id),
  });

  // Compute product reference early so hooks can use it
  const product = data?.product;

  // Update analytics label and document title when product is ready
  useEffect(() => {
    if (!product) return;
    try {
      labelProductPage(product.id, product.title);
      if (typeof document !== "undefined" && product.title) {
        document.title = `${product.title} – Artivio`;
      }
    } catch (e) {
      // non-blocking
    }
  }, [product?.id, product?.title]);

  // After hooks are declared, render based on loading/error states
  if (isLoading) return <LoadingPage />;
  if (error || !product) return <div>Product not found</div>;
  const isInCart = items.some((item) => item.id === product.id);
  const isService = (product.type || "product") === "service";

  const handleToggleCart = () => {
    if (isInCart) {
      removeItem(product.id);
      toast.error(`${product.title} removed from cart`);
    } else {
      addItem(product);
      toast.success(`${product.title} added to cart`);
    }
  };

  const handleBookAppointment = () => {
    router.push(
      `/checkout/appointment?productId=${product.id}&price=${product.price}`
    );
  };

  // Build slides: images + optional video
  const slides = [];
  if (product.images?.length) {
    slides.push(...product.images.map((img) => ({ type: "image", src: img })));
  }
  if (product.videoUrl) {
    slides.push({ type: "video", src: product.videoUrl });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Swiper Carousel */}
        <div className="space-y-4">
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            spaceBetween={10}
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={index}>
                {slide.type === "image" ? (
                  <div className="aspect-square relative overflow-hidden rounded-2xl bg-gray-100">
                    <Image
                      src={slide.src}
                      alt={`Slide ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video relative overflow-hidden rounded-2xl bg-gray-100">
                    <video
                      controls
                      className="w-full h-full object-cover"
                      src={slide.src}
                    />
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge className="mb-4 capitalize">
              {isService ? "Appointment" : product.category || "Product"}
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {product.title}
            </h1>
            {product.tagline && (
              <p className="text-xl text-gray-600 mb-4">{product.tagline}</p>
            )}
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-3xl font-bold text-primary">
                ₹{product.price}
              </span>
              {!isService && (
                <Badge
                  variant={product.stock > 10 ? "secondary" : "destructive"}
                >
                  {product.stock} in stock
                </Badge>
              )}
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="rounded-full">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {isService ? (
              <Button
                onClick={handleBookAppointment}
                size="lg"
                className="w-full rounded-full text-lg py-6 bg-black text-white hover:bg-black/90 active:bg-black/80 active:scale-[.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors"
              >
                Book Appointment
              </Button>
            ) : (
              <Button
                onClick={handleToggleCart}
                size="lg"
                className="w-full rounded-full text-lg py-6 bg-black text-white hover:bg-black/90 active:bg-black/80 active:scale-[.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors disabled:opacity-60 disabled:pointer-events-none"
                disabled={product.stock === 0 && !isInCart}
              >
                {isInCart ? "Remove from Cart" : "Add to Cart"}
              </Button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="p-4 text-center">
                  <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Handcrafted</p>
                  <p className="text-xs text-gray-600">Made to order</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4 text-center">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Free Shipping</p>
                  <p className="text-xs text-gray-600">Orders over ₹2000</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Artisan Info */}
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">Meet the Artisan</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div>
                  <p className="font-medium">Artisan Profile</p>
                  <p className="text-sm text-gray-600">
                    Handcrafting since 2015
                  </p>
                </div>
                <div className="ml-auto flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="text-sm font-medium">4.9</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
