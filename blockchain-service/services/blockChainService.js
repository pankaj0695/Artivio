const { ethers } = require('ethers');
const contractABI = require('../artifacts/contracts/ArtisanRights1155.sol/ArtisanRights1155.json');

class BlockchainService {
  constructor(rpcUrl, privateKey, contractAddress) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl, {
       name: 'polygon-amoy',
       chainId: 80002,
    });
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, contractABI.abi, this.wallet);
  }

  _validateAddress(address) {
    try {
      return ethers.utils.getAddress(address);
    } catch {
      throw new Error(`Invalid Ethereum address: ${address}`);
    }
  }

  async mintCoA({ sku, artisanAddress, tokenURI, walletAddress, royaltyBps = 500}) {
    try {
      artisanAddress = this._validateAddress(walletAddress);

      const tx = await this.contract.mintCoA(
        artisanAddress,
        sku,
        tokenURI,
        royaltyBps
      );

      const receipt = await tx.wait();
      const tokenId = await this.contract.calculateTokenId(sku, 0); // COA_KIND = 0

      return {
        tokenId: tokenId.toString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      throw new Error(`Failed to mint CoA: ${error.message}`);
    }
  }

  async mintRights({ sku, artisanAddress, tokenURI, amount, royaltyBps = 500 }) {
    try {
      artisanAddress = this._validateAddress(artisanAddress);

      const tx = await this.contract.mintRights(
        artisanAddress,
        sku,
        tokenURI,
        amount,
        royaltyBps
      );

      const receipt = await tx.wait();
      const tokenId = await this.contract.calculateTokenId(sku, 1); // RIGHTS_KIND = 1

      return {
        tokenId: tokenId.toString(),
        amount: amount.toString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      throw new Error(`Failed to mint Rights: ${error.message}`);
    }
  }

  async bindLicense({ tokenId, licenseCid }) {
    try {
      const tx = await this.contract.bindLicense(tokenId, licenseCid);
      const receipt = await tx.wait();

      return {
        ok: true,
        txHash: tx.hash,
        recordedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to bind license: ${error.message}`);
    }
  }

  async getTokenInfo(tokenId) {
    try {
      const uri = await this.contract.uri(tokenId);
      const exists = await this.contract.exists(tokenId);
      const totalSupply = await this.contract.totalSupply(tokenId);

      if (!exists) {
        throw new Error('Token does not exist');
      }

      // Extract SKU and kind from tokenId
      const tokenIdBN = ethers.BigNumber.from(tokenId);
      const sku = tokenIdBN.shr(16).toString(); // Right shift 16 bits
      const kind = tokenIdBN.and(0xFFFF).toString(); // Get last 16 bits

      return {
        tokenId: tokenId.toString(),
        sku,
        kind: kind === '0' ? 'CoA' : 'Rights',
        tokenURI: uri,
        totalSupply: totalSupply.toString(),
        exists
      };
    } catch (error) {
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  async recordProvenanceNote({ tokenId, ref, summary }) {
    try {
      const tx = await this.contract.recordProvenanceNote(tokenId, ref);
      await tx.wait();

      return {
        ok: true,
        recordedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to record provenance: ${error.message}`);
    }
  }

  async verifyToken(tokenId) {
    try {
      const tokenInfo = await this.getTokenInfo(tokenId);
      const [royaltyReceiver, royaltyAmount] = await this.contract.royaltyInfo(
        tokenId,
        ethers.utils.parseEther("1") // 1 MATIC for percentage calculation
      );

      return {
        valid: tokenInfo.exists,
        tokenId: tokenInfo.tokenId,
        sku: tokenInfo.sku,
        kind: tokenInfo.kind,
        tokenURI: tokenInfo.tokenURI,
        totalSupply: tokenInfo.totalSupply,
        royalty: {
          receiver: royaltyReceiver,
          bps: Math.round((royaltyAmount / ethers.utils.parseEther("1")) * 10000)
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async testConnection() {
    try {
      const network = await this.provider.getNetwork();
      const balance = await this.wallet.getBalance();
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
      console.log('Wallet balance:', ethers.utils.formatEther(balance), 'MATIC');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

module.exports = BlockchainService;
