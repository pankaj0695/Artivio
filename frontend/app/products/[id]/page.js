"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/ui/loading"; // ✅ ensure this is a named export: `export const LoadingPage = () => (...)`
import { useCartStore } from "@/lib/store";
import { getProduct } from "@/lib/firestore";
import {
  Star,
  Package,
  Truck,
  Shield,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { labelProductPage } from "@/lib/analytics";
import { useStaticTranslation } from "@/lib/use-static-translation";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslatedContent } from "@/lib/use-translated-content";
import { BlockchainService } from "@/lib/blockchain";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useStaticTranslation();
  const { language } = useLanguage();

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => getProduct(params.id),
  });

  const product = data?.product;

  const { translated: translatedTitle } = useTranslatedContent(
    product?.title || "",
    language
  );
  const { translated: translatedDesc } = useTranslatedContent(
    product?.description || "",
    language
  );

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

  if (isLoading) return <LoadingPage />;
  if (error || !product) return <div>{t("productDetail.notFound")}</div>;

  const isInCart = items.some((item) => item.id === product.id);
  const isService = (product.type || "product") === "service";
  const isNFTMinted =
    !isService && product.nftTokenId && product.artisanWallet;

  const handleToggleCart = () => {
    if (isInCart) {
      removeItem(product.id);
      toast.error(
        `${translatedTitle || product.title} ${t(
          "productDetail.removedFromCart"
        )}`
      );
    } else {
      addItem(product);
      toast.success(
        `${translatedTitle || product.title} ${t("productDetail.addedToCart")}`
      );
    }
  };

  const handleBookAppointment = () => {
    router.push(
      `/checkout/appointment?productId=${product.id}&price=${product.price}`
    );
  };

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
            <div className="flex items-center gap-2 mb-4">
              <Badge className="capitalize">
                {isService
                  ? t("productDetail.appointment")
                  : product.category || t("common.products")}
              </Badge>
              {isNFTMinted && (
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                  <Shield className="h-3 w-3 mr-1" />
                  {t("Digitally Verified")}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {translatedTitle || product.title}
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
                  {product.stock} {t("productDetail.inStock")}
                </Badge>
              )}
            </div>
          </div>

          {/* NFT Certificate Card */}
          {isNFTMinted && (
            <Card className="rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {t("Blockchain Certificate of Authenticity")}
                      </h3>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {t(
                        "This product is verified on the blockchain, ensuring its authenticity and origin."
                      )}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{t("Token ID")}:</span>
                        <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                          {product.nftTokenId}
                        </span>
                      </div>
                      {product.sku && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{t("SKU")}:</span>
                          <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                            {product.sku}
                          </span>
                        </div>
                      )}
                      {product.nftMintedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            {t("Certified On")}:
                          </span>
                          <span className="text-xs">
                            {new Date(
                              product.nftMintedAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      {product.nftTxHash && (
                        <a
                          href={BlockchainService.getPolygonScanUrl(
                            product.nftTxHash
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {t("View on Blockchain")}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                      {product.nftIpfsHash && (
                        <a
                          href={BlockchainService.getIPFSUrl(
                            product.nftIpfsHash.replace("ipfs://", "")
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-purple-600 hover:text-purple-800 font-medium"
                        >
                          {t("View Metadata")}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {translatedDesc || product.description}
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
                {t("productDetail.bookAppointment")}
              </Button>
            ) : (
              <Button
                onClick={handleToggleCart}
                size="lg"
                className="w-full rounded-full text-lg py-6 bg-black text-white hover:bg-black/90 active:bg-black/80 active:scale-[.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors disabled:opacity-60 disabled:pointer-events-none"
                disabled={product.stock === 0 && !isInCart}
              >
                {isInCart
                  ? t("productDetail.removeFromCart")
                  : t("productDetail.addToCart")}
              </Button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="p-4 text-center">
                  <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">
                    {t("productDetail.handcrafted")}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t("productDetail.madeToOrder")}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4 text-center">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">
                    {t("productDetail.freeShipping")}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t("productDetail.ordersOver")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Artisan Info */}
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">
                {t("productDetail.meetTheArtisan")}
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div>
                  <p className="font-medium">{t("productDetail.artisanProfile")}</p>
                  <p className="text-sm text-gray-600">
                    {t("productDetail.handcraftingSince")}
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
