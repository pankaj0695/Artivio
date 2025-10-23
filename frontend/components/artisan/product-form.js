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
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState({});
  const [images, setImages] = useState(product?.images || []);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [nftMinting, setNftMinting] = useState(false);
  const [nftStatus, setNftStatus] = useState(null);

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
      alert("Please upload at least 1 image before generating a video.");
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
        alert(result?.message || "Failed to generate video.");
        return;
      }
      if (result.status === "uploaded" && result.cloudinary_url) {
        setValue("videoUrl", result.cloudinary_url, { shouldDirty: true });
      } else if (result.status === "timeout") {
        alert("Video generation is still running. Please try again later.");
      } else if (result.status === "done_no_video") {
        alert("Generation finished but no video bytes were returned.");
      } else if (result.status === "error") {
        alert(result.message || "Cloud upload failed.");
      }
    } catch (e) {
      console.error("Video generate error:", e);
      alert("An error occurred while generating the video.");
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
        alert("Failed to upload video.");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Video upload failed.");
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

  const onSubmit = async (data) => {
    setLoading(true);
    const productData = {
      ...data,
      artisanId: user.uid,
      price: parseFloat(data.price),
      // stock only relevant for physical products
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

      const sku = parseInt(`${Date.now()}${Math.floor(Math.random() * 1000)}`);

      setNftMinting(true);
      setNftStatus("Minting blockchain certificate...");

      const nftResult = await BlockchainService.mintCoA({
        ...productData,
        sku: sku,
        artisanWallet: data.artisanWallet,
      });

      if (nftResult.success) {
        // Step 4: Update product with NFT data
        // await updateProductWithNFT(productRef.id, nftResult);

        setNftStatus({
          type: "success",
          message: "Blockchain certificate created successfully!",
          tokenId: nftResult.tokenId,
          txHash: nftResult.txHash,
        });

        // Redirect after a brief delay to show success message
        setTimeout(() => {
          router.push("/artisan/products");
        }, 3000);
      } else {
        // NFT minting failed, but product was created
        await updateProductNFTError(productRef.id, nftResult.error);

        setNftStatus({
          type: "error",
          message: `Product saved, but blockchain certificate failed: ${nftResult.error}`,
          canRetry: true,
          productId: productRef.id,
        });
      }

      router.push("/artisan/products");
    } catch (error) {
      console.error("Error saving product:", error);
      setNftStatus({
        type: "error",
        message: "Failed to save product. Please try again.",
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
              ? "Edit Service"
              : "Edit Product"
            : listingType === "service"
            ? "Add New Service"
            : "Add New Product"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Listing Type</Label>
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
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="title">
                  {listingType === "service"
                    ? "Service Title"
                    : "Product Title"}
                </Label>
                <AIButton
                  onClick={generateTitle}
                  loading={aiLoading.title}
                  tooltip="Generate title"
                />
              </div>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                error={errors.title?.message}
              />
            </div>

            {listingType !== "service" && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <AIButton
                    onClick={generateTagline}
                    loading={aiLoading.tagline}
                    tooltip="Generate tagline with AI"
                  />
                </div>
                <Input
                  id="tagline"
                  {...register("tagline")}
                  placeholder="A catchy tagline for your product"
                />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="description">Description</Label>
                <AIButton
                  onClick={generateDescription}
                  loading={aiLoading.description}
                  tooltip="Generate description with AI"
                />
              </div>
              <Textarea
                id="description"
                rows={4}
                {...register("description", {
                  required: "Description is required",
                })}
                error={errors.description?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", { required: "Price is required" })}
                  error={errors.price?.message}
                />
              </div>
              {listingType !== "service" && (
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    {...register("stock", { required: "Stock is required" })}
                    error={errors.stock?.message}
                  />
                </div>
              )}
            </div>

            {listingType !== "service" && (
              <div>
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => setValue("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
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
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <AIButton
                    onClick={generateTags}
                    loading={aiLoading.tags}
                    tooltip="Generate tags with AI"
                  />
                </div>
                <Input
                  id="tags"
                  {...register("tags")}
                  placeholder="handmade, pottery, ceramic"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <Label>
                  {listingType === "service"
                    ? "Images (optional)"
                    : "Product Images"}
                </Label>
                {listingType !== "service" && (
                  <span className="text-xs text-red-600">
                    Required for video generation
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
                  Please upload at least one image.
                </p>
              )}
            </div>

            {listingType !== "service" && (
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Label htmlFor="videoUrl" className="mr-auto">
                    Video
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateVideo}
                    disabled={videoGenerating || images.length === 0}
                  >
                    <Film className="h-4 w-4 mr-2" />
                    {videoGenerating ? "Generating…" : "Generate Video"}
                  </Button>
                  <div>
                    <label
                      className={`inline-flex items-center px-3 py-2 border rounded-md text-sm ${
                        videoGenerating
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <UploadCloud className="h-4 w-4 mr-2" /> Upload Video
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
                  placeholder="Optional video URL"
                />
                {videoGenerating && (
                  <div className="mt-3">
                    <div className="w-full h-48 rounded-lg bg-gray-200 animate-pulse" />
                    <p className="text-sm text-gray-600 mt-2">
                      Generating your video (about 1-2 minutes)…
                    </p>
                  </div>
                )}
                {videoUploading && (
                  <p className="text-sm text-gray-600 mt-2">Uploading video…</p>
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

            {listingType == "product" && (
              // Add this to your form fields in ProductForm component
              <div>
                <Label htmlFor="artisanWallet">Blockchain Wallet Address</Label>
                <Input
                  id="artisanWallet"
                  {...register("artisanWallet", {
                    required:
                      "Wallet address is required for blockchain certificate",
                    pattern: {
                      value: /^0x[a-fA-F0-9]{40}$/,
                      message: "Please enter a valid Ethereum wallet address",
                    },
                  })}
                  placeholder="0x1234567890123456789012345678901234567890"
                  error={errors.artisanWallet?.message}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This address will receive NFT royalties. Make sure you control
                  this wallet.
                </p>
              </div>
            )}

            {listingType === "service" && (
              <div>
                <Label htmlFor="bookingUrl">Booking/Contact URL</Label>
                <Input
                  id="bookingUrl"
                  {...register("bookingUrl", {
                    required: "Booking URL is required for services",
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
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => setValue("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
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
                      Creating Blockchain Certificate
                    </p>
                    <p className="text-xs text-blue-700">
                      {nftStatus || "Please wait..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {nftStatus && nftStatus === "object" && (
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
                        <strong>Token ID:</strong> {nftStatus.tokenId}
                      </p>
                      <p>
                        <strong>Transaction:</strong>{" "}
                        <a
                          href={BlockchainService.getPolygonScanUrl(
                            nftStatus.txHash
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View on PolygonScan
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
                      Retry Blockchain Certificate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {nftMinting
                ? "Creating Certificate..."
                : loading
                ? "Saving..."
                : isEdit
                ? listingType === "service"
                  ? "Update Service"
                  : "Update Product"
                : listingType === "service"
                ? "Create Service"
                : "Create Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
