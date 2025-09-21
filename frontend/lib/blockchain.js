const BLOCKCHAIN_API_URL = process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL;

export class BlockchainService {
  static async mintCoA(productData) {
    try {
      const metadata = {
      name: productData.title,
      description: productData.description,
      imageCID: productData.images?.[0] || '',
      external_url: `${window.location.origin}/products/${productData.id}`,
      attributes: [
        { trait_type: 'Category', value: productData.category },
        { trait_type: 'Price', value: `₹${productData.price}` },
        { trait_type: 'Artisan', value: productData.artisanName },
        { trait_type: 'Created', value: new Date().toISOString().split('T')[0] },
        ...productData.tags?.map(tag => ({ trait_type: 'Tag', value: tag })) || []
      ]
    };

     const tokenURI = await this.uploadMetadata(metadata);

      const response = await fetch(`${BLOCKCHAIN_API_URL}/api/blockchain/mint-coa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        sku: productData.sku,
        artisanId: productData.artisanId,
        tokenURI: tokenURI,
        royaltyBps: 500 ,
        walletAddress: productData.artisanWallet  
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to mint CoA');
      }

      return {
        success: true,
        tokenId: result.tokenId,
        txHash: result.txHash,
        ipfsHash: tokenURI,
        blockNumber: result.blockNumber
      };
    } catch (error) {
      console.error('Blockchain minting error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async verifyToken(tokenId) {
    try {
      const response = await fetch(`${BLOCKCHAIN_API_URL}/api/verify/${tokenId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify token');
      }

      return result;
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false, error: error.message };
    }
  }

  static getPolygonScanUrl(txHash) {
    return `https://amoy.polygonscan.com/tx/${txHash}`;
  }

  static getIPFSUrl(ipfsHash) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }

static async uploadMetadata(metadata) {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_URL}/api/ipfs/upload-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload metadata to IPFS');
    }

    return result.ipfsUrl; // Return the IPFS URL for tokenURI
  } catch (error) {
    console.error('Metadata upload error:', error);
    throw error;
  }
}


  
}
