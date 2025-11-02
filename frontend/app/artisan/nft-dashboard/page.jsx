"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/auth/role-guard";
import { getAllArtisanProducts } from "@/lib/firestore";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

export default function NFTDashboardPage() {
  return (
    <RoleGuard requiredRole="artisan">
      <NFTDashboardContent />
    </RoleGuard>
  );
}

function NFTDashboardContent() {
  const { user } = useAuth();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["artisan-nft-dashboard", user?.uid],
    queryFn: () => getAllArtisanProducts(user.uid),
    enabled: !!user,
  });

  const products =
    productsData?.products?.filter((p) => p.nftTokenId) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        NFT Token Dashboard
      </h1>

      {isLoading ? (
        <p>Loading NFT records...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-600">No NFTs minted yet.</p>
      ) : (
        <Card className="overflow-hidden rounded-2xl border shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Token ID</TableHead>
                  <TableHead>IPFS Hash</TableHead>
                  <TableHead>Minted At</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Network</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.title}
                    </TableCell>
                    <TableCell>{product.nftTokenId}</TableCell>
                    <TableCell className="truncate max-w-[150px]">
                      <a
                        href={`https://ipfs.io/ipfs/${product.nftIpfsHash.replace("ipfs://", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {product.nftIpfsHash.slice(7, 20)}...
                      </a>
                    </TableCell>
                    <TableCell>
                      {new Date(product.nftMintedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://amoy.polygonscan.com/tx/${product.nftTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        View Tx
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge>Polygon Amoy</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
