const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

class IPFSService {
  constructor(pinataJWT) {
    this.pinataJWT = pinataJWT;
    this.pinataApiUrl = 'https://api.pinata.cloud';
  }

  async uploadFile(filePath, fileName = null) {
    try {
      const formData = new FormData();
      const fileStream = fs.createReadStream(filePath);
      const actualFileName = fileName || path.basename(filePath);
      
      formData.append('file', fileStream, actualFileName);
      
      const metadata = JSON.stringify({
        name: actualFileName,
        keyvalues: {
          uploadedAt: new Date().toISOString()
        }
      });
      formData.append('pinataMetadata', metadata);

      const response = await axios.post(
        `${this.pinataApiUrl}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.pinataJWT}`
          }
        }
      );

      return {
        cid: response.data.IpfsHash,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
        ipfsUrl: `ipfs://${response.data.IpfsHash}`
      };
    } catch (error) {
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  async uploadJSON(jsonData, fileName = 'metadata.json') {
    try {
      const response = await axios.post(
        `${this.pinataApiUrl}/pinning/pinJSONToIPFS`,
        {
          pinataContent: jsonData,
          pinataMetadata: {
            name: fileName,
            keyvalues: {
              uploadedAt: new Date().toISOString(),
              type: 'metadata'
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.pinataJWT}`
          }
        }
      );

      return {
        cid: response.data.IpfsHash,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
        ipfsUrl: `ipfs://${response.data.IpfsHash}`
      };
    } catch (error) {
      throw new Error(`Failed to upload JSON to IPFS: ${error.message}`);
    }
  }

  // Upload metadata according to our schema
  async uploadNFTMetadata({
    name,
    description,
    imageCID,
    attributes = [],
    license = {},
    provenance = {},
    externalUrl = ""
  }) {
    const metadata = {
      name,
      description,
      image: `ipfs://${imageCID}`,
      external_url: externalUrl,
      attributes,
      license,
      provenance,
      rights_notice: "See license."
    };

    return await this.uploadJSON(metadata, `${name.replace(/\s+/g, '_')}_metadata.json`);
  }

  // Create license files (FREE VERSION)
  async uploadLicense(licenseData) {
    // Create machine-readable license JSON
    const licenseJson = {
      type: licenseData.type || "reproduction-limited",
      scope: licenseData.scope || "personal", 
      territory: licenseData.territory || "worldwide",
      term: licenseData.term || "perpetual",
      attribution: licenseData.attribution || true,
      commercial_use: licenseData.commercialUse || false,
      modifications: licenseData.modifications || false,
      resale_conditions: licenseData.resaleConditions || {}
    };

    const licenseResult = await this.uploadJSON(licenseJson, 'license.json');
    
    return {
      type: licenseData.type,
      editions: licenseData.editions,
      human_readable_url: licenseData.pdfUrl || null, 
      machine_readable_url: licenseResult.ipfsUrl
    };
  }

  // Helper method to check your usage
  async getPinataUsage() {
    try {
      const response = await axios.get(`${this.pinataApiUrl}/data/userPinnedDataTotal`, {
        headers: {
          Authorization: `Bearer ${this.pinataJWT}`
        }
      });
      return response.data;
    } catch (error) {
      console.warn('Could not fetch Pinata usage:', error.message);
      return null;
    }
  }
}

module.exports = IPFSService;
