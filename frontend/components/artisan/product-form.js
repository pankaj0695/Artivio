"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/ui/image-uploader";
import { AIButton } from "@/components/ai/ai-button";
import {
  createProduct,
  updateProduct,
  updateProductWithNFT,
} from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Film, UploadCloud } from "lucide-react";
import { BlockchainService } from "@/lib/blockchain";
import { useStaticTranslation } from "@/lib/use-static-translation";
import { Checkbox } from "@/components/ui/checkbox";

const categories = [
  "pottery",
  "textiles",
  "jewelry",
  "woodwork",
  "metalwork",
  "painting",
  "sculpture",
  "other",
];

export function ProductForm({ product, isEdit = false }) {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useStaticTranslation();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState({});
  const [images, setImages] = useState(product?.images || []);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [nftMinting, setNftMinting] = useState(false);
  const [nftStatus, setNftStatus] = useState(null);
  const [enableMinting, setEnableMinting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: product?.title || "",
      tagline: product?.tagline || "",
      description: product?.description || "",
      price: product?.price || "",
      stock: product?.stock || "",
      type: product?.type || "product",
      category: product?.category || "",
      tags: product?.tags?.join(", ") || "",
      videoUrl: product?.videoUrl || "",
      status: product?.status || "active",
      bookingUrl: product?.bookingUrl || "",
      artisanWallet: product?.artisanWallet || "",
    },
  });

  const watchedFields = watch();
  const listingType = watchedFields.type || "product";
  const videoPreviewUrl = watchedFields.videoUrl;

  // Build backend Flask API endpoints for content routes
  const buildContentEndpoint = (segment) => {
    const rawBase = process.env.NEXT_PUBLIC_FLASK_API_BASE_URL || "";
    if (!rawBase) return `/api/content/${segment}`; // fallback (assumes proxy)
    const base = rawBase.replace(/\/$/, "");
    const hasApi = /\/api(?:$|\/)/.test(base);
    return hasApi
      ? `${base}/content/${segment}`
      : `${base}/api/content/${segment}`;
  };

  const generateTitle = async () => {
    setAiLoading((prev) => ({ ...prev, title: true }));
    try {
      // Use current title as seed; if empty, fall back to first words of description
      const seed = (watchedFields.title || "").trim();
      const fallbackSeed = (watchedFields.description || "")
        .split(/\s+/)
        .slice(0, 12)
        .join(" ")
        .trim();
      const productTitle = seed || fallbackSeed || "Artisan product";
      const endpoint = buildContentEndpoint("title");
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTitle,
          category: watchedFields.category || "",
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error("Title generation failed:", data);
        return;
      }
      if (data?.title) setValue("title", data.title, { shouldDirty: true });
    } catch (e) {
      console.error("Title generation error:", e);
    } finally {
      setAiLoading((prev) => ({ ...prev, title: false }));
    }
  };

  const generateVideo = async () => {
    if (images.length < 1) {
      alert(t("productForm.uploadImageFirst"));
      return;
    }
    const buildVideosEndpoint = () => {
      const rawBase = process.env.NEXT_PUBLIC_FLASK_API_BASE_URL || "";
      if (!rawBase) return "/videos/generate";
      const base = rawBase.replace(/\/$/, "");
      const hasApi = /\/api(?:$|\/)/.test(base);
      return hasApi ? `${base}/videos/generate` : `${base}/api/videos/generate`;
    };
    const endpoint = buildVideosEndpoint();
    setVideoGenerating(true);
    console.log(images[0]);
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: images[0],
        }),
      });
      const result = await resp.json();
      console.log("Video generation response:", result);
      if (!resp.ok) {
        console.error("Video generation failed:", result);
        alert(result?.message || t("productForm.videoGenerationFailed"));
        return;
      }
      if (result.status === "uploaded" && result.cloudinary_url) {
        setValue("videoUrl", result.cloudinary_url, { shouldDirty: true });
      } else if (result.status === "timeout") {
        alert(t("productForm.videoStillRunning"));
      } else if (result.status === "done_no_video") {
        alert(t("productForm.noVideoBytesReturned"));
      } else if (result.status === "error") {
        alert(result.message || t("productForm.cloudUploadFailed"));
      }
    } catch (e) {
      console.error("Video generate error:", e);
      alert(t("productForm.uploadError"));
    } finally {
      setVideoGenerating(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", "Artivio");
      const cloudName = "dnfkcjujc";
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
      const r = await fetch(url, { method: "POST", body: form });
      const data = await r.json();
      if (data.secure_url) {
        setValue("videoUrl", data.secure_url, { shouldDirty: true });
      } else {
        console.error("Cloudinary upload error:", data);
        alert(t("productForm.videoUploadFailed"));
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert(t("productForm.videoUploadFailed"));
    } finally {
      setVideoUploading(false);
      // reset input value so same file can be selected again
      e.target.value = "";
    }
  };

  const generateDescription = async () => {
    setAiLoading((prev) => ({ ...prev, description: true }));
    try {
      const endpoint = buildContentEndpoint("description");
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTitle: watchedFields.title || "",
          category: watchedFields.category || "",
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error("Description generation failed:", data);
        return;
      }
      if (data?.description)
        setValue("description", data.description, { shouldDirty: true });
    } catch (e) {
      console.error("Description generation error:", e);
    } finally {
      setAiLoading((prev) => ({ ...prev, description: false }));
    }
  };

  const generateTagline = async () => {
    setAiLoading((prev) => ({ ...prev, tagline: true }));
    try {
      const endpoint = buildContentEndpoint("tagline");
      const keywords = (watchedFields.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTitle: watchedFields.title || "",
          keywords,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error("Tagline generation failed:", data);
        return;
      }
      if (data?.tagline)
        setValue("tagline", data.tagline, { shouldDirty: true });
    } catch (e) {
      console.error("Tagline generation error:", e);
    } finally {
      setAiLoading((prev) => ({ ...prev, tagline: false }));
    }
  };

  const generateTags = async () => {
    setAiLoading((prev) => ({ ...prev, tags: true }));
    try {
      const endpoint = buildContentEndpoint("tags");
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTitle: watchedFields.title || "",
          category: watchedFields.category || "",
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error("Tags generation failed:", data);
        return;
      }
      if (Array.isArray(data?.tags)) {
        setValue(
          "tags",
          data.tags
            .map((t) => String(t).trim())
            .filter(Boolean)
            .join(", "),
          { shouldDirty: true }
        );
      }
    } catch (e) {
      console.error("Tags generation error:", e);
    } finally {
      setAiLoading((prev) => ({ ...prev, tags: false }));
    }
  };

  // Update the onSubmit function
  const onSubmit = async (data) => {
    setLoading(true);
    const productData = {
      ...data,
      artisanId: user.uid,
      price: parseFloat(data.price),
      stock: listingType === "service" ? 0 : parseInt(data.stock),
      type: listingType,
      tags: data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      images,
      currency: "INR",
    };

    let productRef;
    try {
      if (isEdit) {
        await updateProduct(product.id, productData);
        productRef = { id: product.id };
      } else {
        productRef = await createProduct(productData);
        productData.id = productRef.id;
      }

      // Only mint NFT if enabled
      if (enableMinting && listingType === "product") {
        const sku = parseInt(`${Date.now()}${Math.floor(Math.random() * 1000)}`);

        setNftMinting(true);
        setNftStatus("Minting blockchain certificate...");

        const nftResult = await BlockchainService.mintCoA({
          ...productData,
          sku: sku,
          artisanWallet: data.artisanWallet,
        });

        if (nftResult.success) {
          // Update product with all NFT-related data
          await updateProduct(productRef.id, {
            artisanWallet: data.artisanWallet,
            nftTokenId: nftResult.tokenId,
            nftTxHash: nftResult.txHash,
            nftIpfsHash: nftResult.ipfsHash,
            nftMintedAt: new Date().toISOString(),
            sku: sku,
          });

          setNftStatus({
            type: "success",
            message: t("productForm.blockchainCertificateCreated"),
            tokenId: nftResult.tokenId,
            txHash: nftResult.txHash,
          });

          setTimeout(() => {
            router.push("/artisan/products");
          }, 3000);
        } else {
          setNftStatus({
            type: "error",
            message: t("productForm.blockchainCertificateFailed") + ": " + nftResult.error,
            canRetry: true,
            productId: productRef.id,
          });
        }
      } else {
        // If minting is not enabled, redirect immediately
        router.push("/artisan/products");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      setNftStatus({
        type: "error",
        message: t("productForm.failedToSaveProduct"),
      });
    } finally {
      setLoading(false);
      setNftMinting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEdit
            ? listingType === "service"
              ? t("productForm.edit") + " " + t("productForm.service")
              : t("productForm.edit") + " " + t("productForm.product")
            : listingType === "service"
            ? t("productForm.add") + " " + t("productForm.service")
            : t("productForm.add") + " " + t("productForm.product")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">{t("productForm.listingType")}</Label>
              <Select
                onValueChange={(value) =>
                  setValue("type", value, { shouldDirty: true })
                }
                defaultValue={listingType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">{t("productForm.product")}</SelectItem>
                  <SelectItem value="service">{t("productForm.service")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="title">
                  {listingType === "service"
                    ? t("productForm.serviceTitle")
                    : t("productForm.productTitle")}
                </Label>
                <AIButton
                  onClick={generateTitle}
                  loading={aiLoading.title}
                  tooltip={t("productForm.listingType")}
                />
              </div>
              <Input
                id="title"
                {...register("title", { required: t("productForm.productTitle") + " is required" })}
                error={errors.title?.message}
              />
            </div>

            {listingType !== "service" && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="tagline">{t("productForm.tagline")}</Label>
                  <AIButton
                    onClick={generateTagline}
                    loading={aiLoading.tagline}
                    tooltip={t("productForm.tagline")}
                  />
                </div>
                <Input
                  id="tagline"
                  {...register("tagline")}
                  placeholder={t("productForm.tagsPlaceholder")}
                />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="description">{t("productForm.description")}</Label>
                <AIButton
                  onClick={generateDescription}
                  loading={aiLoading.description}
                  tooltip={t("productForm.description")}
                />
              </div>
              <Textarea
                id="description"
                rows={4}
                {...register("description", {
                  required: t("productForm.description") + " is required",
                })}
                error={errors.description?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">{t("productForm.price")}</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", { required: t("productForm.price") + " is required" })}
                  error={errors.price?.message}
                />
              </div>
              {listingType !== "service" && (
                <div>
                  <Label htmlFor="stock">{t("productForm.stockQuantity")}</Label>
                  <Input
                    id="stock"
                    type="number"
                    {...register("stock", { required: t("productForm.stockQuantity") + " is required" })}
                    error={errors.stock?.message}
                  />
                </div>
              )}
            </div>

            {listingType !== "service" && (
              <div>
                <Label htmlFor="category">{t("productForm.category")}</Label>
                <Select onValueChange={(value) => setValue("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("productForm.categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {listingType !== "service" && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="tags">{t("productForm.tags")}</Label>
                  <AIButton
                    onClick={generateTags}
                    loading={aiLoading.tags}
                    tooltip={t("productForm.tags")}
                  />
                </div>
                <Input
                  id="tags"
                  {...register("tags")}
                  placeholder={t("productForm.tagsPlaceholder")}
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <Label>
                  {listingType === "service"
                    ? t("productForm.imagesOptional")
                    : t("productForm.images")}
                </Label>
                {listingType !== "service" && (
                  <span className="text-xs text-red-600">
                    {t("productForm.requiredForVideo")}
                  </span>
                )}
              </div>
              <ImageUploader
                productId={product?.id || "new"}
                onImagesChange={setImages}
                initialImages={images}
              />
              {listingType !== "service" && images.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {t("productForm.uploadRequired")}
                </p>
              )}
            </div>

            {listingType !== "service" && (
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Label htmlFor="videoUrl" className="mr-auto">
                    {t("productForm.video")}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateVideo}
                    disabled={videoGenerating || images.length === 0}
                  >
                    <Film className="h-4 w-4 mr-2" />
                    {videoGenerating ? t("productForm.generating") : t("productForm.generateVideo")}
                  </Button>
                  <div>
                    <label
                      className={`inline-flex items-center px-3 py-2 border rounded-md text-sm ${
                        videoGenerating
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <UploadCloud className="h-4 w-4 mr-2" /> {t("productForm.uploadVideo")}
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                        disabled={videoGenerating}
                      />
                    </label>
                  </div>
                </div>
                <Input
                  id="videoUrl"
                  {...register("videoUrl")}
                  placeholder={t("productForm.videoUrl")}
                />
                {videoGenerating && (
                  <div className="mt-3">
                    <div className="w-full h-48 rounded-lg bg-gray-200 animate-pulse" />
                    <p className="text-sm text-gray-600 mt-2">
                      {t("productForm.generatingVideo")}
                    </p>
                  </div>
                )}
                {videoUploading && (
                  <p className="text-sm text-gray-600 mt-2">{t("productForm.uploadingVideo")}</p>
                )}
                {videoPreviewUrl && (
                  <div className="mt-3">
                    <video
                      className="w-full rounded-lg"
                      src={videoPreviewUrl}
                      controls
                    />
                  </div>
                )}
              </div>
            )}

            {listingType === "product" && (
              <>
                {/* Checkbox to enable blockchain certificate minting */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableMinting"
                    checked={enableMinting}
                    onCheckedChange={setEnableMinting}
                  />
                  <Label htmlFor="enableMinting" className="cursor-pointer">
                    {t("Create blockchain certificate for this product")}
                  </Label>
                </div>

                {/* Only show wallet address field if minting is enabled */}
                {enableMinting && (
                  <div>
                    <Label htmlFor="artisanWallet">{t("productForm.wallet")}</Label>
                    <Input
                      id="artisanWallet"
                      {...register("artisanWallet", {
                        required: enableMinting
                          ? t("productForm.wallet") + " is required for blockchain certificate"
                          : false,
                        pattern: {
                          value: /^0x[a-fA-F0-9]{40}$/,
                          message: "Please enter a valid Ethereum wallet address",
                        },
                      })}
                      placeholder="0x1234567890123456789012345678901234567890"
                      error={errors.artisanWallet?.message}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t("productForm.walletDescription")}
                    </p>
                  </div>
                )}
              </>
            )}

            {listingType === "service" && (
              <div>
                <Label htmlFor="bookingUrl">{t("productForm.bookingUrl")}</Label>
                <Input
                  id="bookingUrl"
                  {...register("bookingUrl", {
                    required: t("productForm.bookingUrlRequired"),
                  })}
                  placeholder="https://wa.me/91XXXXXXXXXX or Calendly link"
                />
                {errors.bookingUrl?.message && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.bookingUrl.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="status">{t("productForm.status")}</Label>
              <Select onValueChange={(value) => setValue("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("productForm.active")}</SelectItem>
                  <SelectItem value="draft">{t("productForm.draft")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* NFT Minting Status */}
          {nftMinting && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {t("productForm.creatingBlockchainCertificate")}
                    </p>
                    <p className="text-xs text-blue-700">
                      {nftStatus || t("productForm.pleaseWait")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {nftStatus && typeof nftStatus === "object" && (
            <Card
              className={`border-2 ${
                nftStatus.type === "success"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p
                    className={`text-sm font-medium ${
                      nftStatus.type === "success"
                        ? "text-green-900"
                        : "text-red-900"
                    }`}
                  >
                    {nftStatus.message}
                  </p>

                  {nftStatus.type === "success" && (
                    <div className="text-xs space-y-1">
                      <p>
                        <strong>{t("productForm.tokenId")}:</strong> {nftStatus.tokenId}
                      </p>
                      <p>
                        <strong>{t("productForm.transaction")}:</strong>{" "}
                        <a
                          href={BlockchainService.getPolygonScanUrl(
                            nftStatus.txHash
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {t("productForm.viewOnPolygonScan")}
                        </a>
                      </p>
                    </div>
                  )}

                  {nftStatus.canRetry && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => retryNFTMinting(nftStatus.productId)}
                      className="mt-2"
                    >
                      {t("productForm.retryBlockchainCertificate")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading || nftMinting} className="flex-1">
              {nftMinting
                ? t("productForm.creatingCertificate")
                : loading
                ? t("productForm.saving")
                : isEdit
                ? listingType === "service"
                  ? t("productForm.updateService")
                  : t("productForm.updateProduct")
                : listingType === "service"
                ? t("productForm.createService")
                : t("productForm.createProduct")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading || nftMinting}
            >
              {t("productForm.cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
