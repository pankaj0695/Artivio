# Artisan Blockchain Service

Digital Proof of Origin (NFT) service for authentic artisan crafts.

## Quick Start

1. Install dependencies: `npm install`
2. Test setup: `npm run test-setup`
3. Check balance: `npm run check-balance`
4. Deploy contracts: `npm run deploy:testnet`
5. Start service: `npm start`

## Environment Setup

- Copy `.env.example` to `.env`
- Fill in your wallet private key and Pinata JWT
- Get testnet funds from Polygon faucets

## Free Resources Used

- Polygon Amoy Testnet (free blockchain)
- Pinata IPFS (free file storage)
- Render.com (free hosting)

Built for hackathon - completely free setup! 🎉

<!-- # Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js -->
```

# Artisan NFT Blockchain Service API

Base URL: https://artisan-nft-api.onrender.com

## Endpoints:

### POST /api/mint-coa
Mint Certificate of Authenticity for artisan products
- **Body**: `{ sku, artisanAddress, metadata }`
- **Returns**: `{ tokenId, txHash, ipfsHash }`

### POST /api/mint-rights  
Mint Rights NFT for licensing
- **Body**: `{ sku, artisanAddress, tokenURI, amount }`
- **Returns**: `{ tokenId, amount, txHash }`

### GET /api/verify/:tokenId
Verify NFT authenticity
- **Returns**: `{ valid, tokenInfo, royalty }`

### POST /api/upload-metadata
Upload metadata to IPFS
- **Body**: `{ name, description, image, attributes }`
- **Returns**: `{ ipfsHash, url }`
