const express = require('express');
const Joi = require('joi');
const BlockchainService = require('../services/blockChainService');
const IPFSService = require('../services/ipfsService');
const DBService = require('../services/dbService');
const firebaseConfig = require('../config/firebase');

const router = express.Router();
// Initialize services
const blockchainService = new BlockchainService(
  process.env.POLYGON_AMOY_RPC_URL, // Free testnet RPC
  process.env.PRIVATE_KEY,
  process.env.CONTRACT_ADDRESS
);

const ipfsService = new IPFSService(process.env.PINATA_JWT);
const dbService = new DBService(firebaseConfig);

// Validation schemas
const mintCoASchema = Joi.object({
  sku: Joi.number().integer().positive().required(),
  artisanId: Joi.string().required(),
  tokenURI: Joi.string().uri().required(),
  royaltyBps: Joi.number().integer().min(0).max(10000).default(500)
});

const mintRightsSchema = Joi.object({
  sku: Joi.number().integer().positive().required(),
  artisanId: Joi.string().required(),
  tokenURI: Joi.string().uri().required(),
  amount: Joi.number().integer().positive().required(),
  royaltyBps: Joi.number().integer().min(0).max(10000).default(500)
});

const uploadMetadataSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  imageCID: Joi.string().required(),
  attributes: Joi.array().items(Joi.object({
    trait_type: Joi.string().required(),
    value: Joi.string().required()
  })).default([]),
  license: Joi.object().default({}),
  provenance: Joi.object().default({}),
  externalUrl: Joi.string().uri().default('')
});

// POST /mint-coa
router.post('/mint-coa', async (req, res) => {
  try {
    const { error, value } = mintCoASchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Mint the NFT
    const result = await blockchainService.mintCoA({
      sku: value.sku,
      artisanAddress: value.artisanId,
      tokenURI: value.tokenURI,
      royaltyBps: value.royaltyBps
    });

    // Save to local database
    await dbService.saveTokenData({
      tokenId: result.tokenId,
      sku: value.sku,
      kind: 'CoA',
      artisanId: value.artisanId,
      tokenURI: value.tokenURI,
      royaltyBps: value.royaltyBps,
      txHash: result.txHash,
      blockNumber: result.blockNumber
    });

    res.json({
      tokenId: result.tokenId,
      txHash: result.txHash,
      blockNumber: result.blockNumber
    });
  } catch (error) {
    console.error('Mint CoA error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /mint-rights
router.post('/mint-rights', async (req, res) => {
  try {
    const { error, value } = mintRightsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await blockchainService.mintRights({
      sku: value.sku,
      artisanAddress: value.artisanId,
      tokenURI: value.tokenURI,
      amount: value.amount,
      royaltyBps: value.royaltyBps
    });

    // Save to local database
    await dbService.saveTokenData({
      tokenId: result.tokenId,
      sku: value.sku,
      kind: 'Rights',
      artisanId: value.artisanId,
      tokenURI: value.tokenURI,
      amount: result.amount,
      royaltyBps: value.royaltyBps,
      txHash: result.txHash,
      blockNumber: result.blockNumber
    });

    res.json({
      tokenId: result.tokenId,
      amount: result.amount,
      txHash: result.txHash
    });
  } catch (error) {
    console.error('Mint Rights error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /upload-metadata (Helper endpoint to upload metadata to IPFS)
router.post('/upload-metadata', async (req, res) => {
  try {
    const { error, value } = uploadMetadataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await ipfsService.uploadNFTMetadata(value);
    
    res.json({
      cid: result.cid,
      ipfsUrl: result.ipfsUrl,
      gatewayUrl: result.gatewayUrl
    });
  } catch (error) {
    console.error('Upload metadata error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /token/:tokenId
router.get('/token/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    // Get from blockchain
    const tokenInfo = await blockchainService.getTokenInfo(tokenId);
    
    // Get from local database for additional info
    const localData = await dbService.getTokenData(tokenId);
    
    // Get provenance events
    const provenanceEvents = await dbService.getProvenanceEvents(tokenId);
    
    res.json({
      ...tokenInfo,
      ...localData,
      provenanceEvents
    });
  } catch (error) {
    console.error('Get token error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /bind-license
router.post('/bind-license', async (req, res) => {
  try {
    const { tokenId, licenseCid } = req.body;
    
    if (!tokenId || !licenseCid) {
      return res.status(400).json({ error: 'tokenId and licenseCid are required' });
    }

    const result = await blockchainService.bindLicense({ tokenId, licenseCid });
    
    // Update local database
    await dbService.updateTokenData(tokenId, { licenseCid });
    
    res.json(result);
  } catch (error) {
    console.error('Bind license error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /provenance-note
router.post('/provenance-note', async (req, res) => {
  try {
    const { tokenId, ref, summary } = req.body;
    
    if (!tokenId || !ref) {
      return res.status(400).json({ error: 'tokenId and ref are required' });
    }

    // Record on blockchain
    const blockchainResult = await blockchainService.recordProvenanceNote({ 
      tokenId, 
      ref, 
      summary 
    });
    
    // Save to local database
    const eventData = await dbService.saveProvenanceEvent({
      tokenId,
      ref,
      summary,
      blockchainRecorded: blockchainResult.recordedAt
    });
    
    res.json({
      ok: true,
      eventId: eventData.id,
      recordedAt: eventData.timestamp
    });
  } catch (error) {
    console.error('Provenance note error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /verify (Verification endpoint)
router.post('/verify', async (req, res) => {
  try {
    const { tokenId } = req.body;
    
    if (!tokenId) {
      return res.status(400).json({ error: 'tokenId is required' });
    }

    const result = await blockchainService.verifyToken(tokenId);
    res.json(result);
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
