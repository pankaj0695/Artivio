const express = require('express');
const multer = require('multer');
const IPFSService = require('../services/ipfsService');
const path = require('path');

const router = express.Router();

// Initialize IPFS service
const ipfsService = new IPFSService(process.env.PINATA_JWT);

// Configure multer for file uploads (store in memory to avoid disk usage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /upload-file
router.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create a temporary file path
    const tempFilePath = path.join(__dirname, '../../temp', req.file.originalname);
    
    // Ensure temp directory exists
    const fs = require('fs');
    const tempDir = path.dirname(tempFilePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write buffer to temporary file
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Upload to IPFS
    const result = await ipfsService.uploadFile(tempFilePath, req.file.originalname);

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    res.json({
      cid: result.cid,
      ipfsUrl: result.ipfsUrl,
      gatewayUrl: result.gatewayUrl
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /upload-json
router.post('/upload-json', async (req, res) => {
  try {
    const { data, fileName = 'data.json' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    const result = await ipfsService.uploadJSON(data, fileName);
    
    res.json({
      cid: result.cid,
      ipfsUrl: result.ipfsUrl,
      gatewayUrl: result.gatewayUrl
    });
  } catch (error) {
    console.error('Upload JSON error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this to your IPFS routes file

// POST /upload-metadata - Specifically for NFT metadata
router.post('/upload-metadata', async (req, res) => {
  try {
    const { name, description, imageCID, external_url, attributes } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ 
        error: 'Name and description are required for NFT metadata' 
      });
    }

    // Create NFT metadata object following ERC-1155 standard
    const metadata = {
      name,
      description,
      imageCID: imageCID || '',
      external_url: external_url || '',
      attributes: attributes || []
    };

    // Generate filename
    const fileName = `metadata-${name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.json`;
    
    // Upload to IPFS
    const result = await ipfsService.uploadJSON(metadata, fileName);
    
    res.json({
      cid: result.cid,
      ipfsUrl: result.ipfsUrl,
      gatewayUrl: result.gatewayUrl,
      metadata: metadata
    });
  } catch (error) {
    console.error('Upload metadata error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /usage (Check Pinata usage)
router.get('/usage', async (req, res) => {
  try {
    const usage = await ipfsService.getPinataUsage();
    res.json(usage || { message: 'Usage data not available' });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
