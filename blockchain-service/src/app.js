const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const blockchainRoutes = require('./routes/blockchain');
const ipfsRoutes = require('./routes/ipfs');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }))


// Routes
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/ipfs', ipfsRoutes);

// Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Artisan NFT Blockchain Service',
    version: '1.0.0',
    status: 'running',
    network: 'Polygon Amoy Testnet',
    contract: process.env.CONTRACT_ADDRESS,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'POST /api/mint-coa',
      'POST /api/mint-rights',
      'GET /api/verify/:tokenId',
      'POST /api/upload-metadata'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Blockchain Service Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});



module.exports = app;
