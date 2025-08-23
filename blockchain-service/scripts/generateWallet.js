// For development purposes only
// This script generates a new wallet for the Polygon Amoy Testnet
const ethers = require('ethers');
const fs = require('fs');

function generateWallet() {
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log('🎉 NEW WALLET GENERATED!');
  console.log('=====================================');
  console.log('📍 Wallet Address:', wallet.address);
  console.log('🔑 Private Key:', wallet.privateKey);
  console.log('📝 Mnemonic Phrase:', wallet.mnemonic.phrase);
  console.log('=====================================');
  console.log('');
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('- NEVER share your private key with anyone');
  console.log('- Save this information in a secure place');
  console.log('- This is for TESTNET only (not real money)');
  console.log('');
  
  // Save to a secure file (for your reference only)
  const walletInfo = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
    createdAt: new Date().toISOString(),
    network: 'Polygon Amoy Testnet',
    purpose: 'Hackathon Development'
  };
  
  fs.writeFileSync('wallet-info.json', JSON.stringify(walletInfo, null, 2));
  console.log('💾 Wallet info saved to: wallet-info.json');
  console.log('🔒 Keep this file secure and NEVER commit to Git!');
}

generateWallet();
