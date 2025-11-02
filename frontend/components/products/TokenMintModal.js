"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { BlockchainService } from "@/lib/blockchain";
import { updateProduct } from "@/lib/firestore";
import { useStaticTranslation } from "@/lib/use-static-translation";

export function TokenMintModal({ product }) {
  const { t } = useStaticTranslation();
  const [open, setOpen] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      artisanWallet: "",
    },
  });

  const onSubmit = async (data) => {
    setMinting(true);
    setMintStatus({
      type: "loading",
      message: t("productForm.creatingBlockchainCertificate"),
    });

    try {
      // Generate SKU for the product
      const sku = parseInt(`${Date.now()}${Math.floor(Math.random() * 1000)}`);

      // Prepare product data with wallet address
      const productData = {
        ...product,
        artisanWallet: data.artisanWallet,
        sku: sku,
      };

      // Call the blockchain service to mint token
      const nftResult = await BlockchainService.mintExistingProductToken(
        productData,
        data.artisanWallet
      );

      if (nftResult.success) {
        // Update product with wallet address and NFT details
        await updateProduct(product.id, {
          artisanWallet: data.artisanWallet,
          nftTokenId: nftResult.tokenId,
          nftTxHash: nftResult.txHash,
          nftIpfsHash: nftResult.ipfsHash,
          nftMintedAt: new Date().toISOString(),
          sku: sku,
        });

        setMintStatus({
          type: "success",
          message: t("productForm.blockchainCertificateCreated"),
          tokenId: nftResult.tokenId,
          txHash: nftResult.txHash,
        });

        // Close modal after 3 seconds and refresh the page
        setTimeout(() => {
          setOpen(false);
          reset();
          setMintStatus(null);
          window.location.reload();
        }, 3000);
      } else {
        setMintStatus({
          type: "error",
          message:
            t("productForm.blockchainCertificateFailed") +
            ": " +
            nftResult.error,
        });
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      setMintStatus({
        type: "error",
        message: t("productForm.failedToSaveProduct") + ": " + error.message,
      });
    } finally {
      setMinting(false);
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!minting) {
      setOpen(newOpen);
      if (!newOpen) {
        reset();
        setMintStatus(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-full flex items-center justify-center gap-2"
        >
          <Shield className="h-4 w-4" />
          {t("Mint NFT Certificate")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("Create Blockchain Certificate")}</DialogTitle>
          <DialogDescription>
            {t("Mint an NFT certificate for")} <strong>{product.title}</strong>.{" "}
            {t("This will create a blockchain record of authenticity.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="artisanWallet">
              {t("productForm.wallet")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="artisanWallet"
              {...register("artisanWallet", {
                required: t("productForm.wallet") + " is required",
                pattern: {
                  value: /^0x[a-fA-F0-9]{40}$/,
                  message: "Please enter a valid Ethereum wallet address",
                },
              })}
              placeholder="0x1234567890123456789012345678901234567890"
              disabled={minting}
            />
            {errors.artisanWallet && (
              <p className="text-xs text-red-600 mt-1">
                {errors.artisanWallet.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {t("productForm.walletDescription")}
            </p>
          </div>

          {/* Minting Status */}
          {mintStatus && (
            <Card
              className={`border-2 ${
                mintStatus.type === "loading"
                  ? "border-blue-200 bg-blue-50"
                  : mintStatus.type === "success"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <CardContent className="pt-6">
                {mintStatus.type === "loading" && (
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {mintStatus.message}
                      </p>
                      <p className="text-xs text-blue-700">
                        {t("productForm.pleaseWait")}
                      </p>
                    </div>
                  </div>
                )}

                {mintStatus.type === "success" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-900">
                      {mintStatus.message}
                    </p>
                    <div className="text-xs space-y-1">
                      <p>
                        <strong>{t("productForm.tokenId")}:</strong>{" "}
                        {mintStatus.tokenId}
                      </p>
                      <p>
                        <strong>{t("productForm.transaction")}:</strong>{" "}
                        <a
                          href={BlockchainService.getPolygonScanUrl(
                            mintStatus.txHash
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {t("productForm.viewOnPolygonScan")}
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {mintStatus.type === "error" && (
                  <p className="text-sm font-medium text-red-900">
                    {mintStatus.message}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={minting}
            >
              {t("productForm.cancel")}
            </Button>
            <Button type="submit" disabled={minting}>
              {minting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("productForm.creatingCertificate")}
                </>
              ) : (
                t("Mint Certificate")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
