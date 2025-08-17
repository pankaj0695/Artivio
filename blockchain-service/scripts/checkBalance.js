// For development purposes only
// This script checks the balance of a wallet on the Polygon Amoy Testnet
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function checkBalance() {
  const provider = new ethers.providers.JsonRpcProvider('https://rpc-amoy.polygon.technology');
  
  // Replace with your wallet address
  const walletAddress = "YOUR_WALLET_ADDRESS_HERE";
  
  try {
    const balance = await provider.getBalance(walletAddress);
    const balanceInMatic = ethers.utils.formatEther(balance);
    
    console.log(`💰 Balance for ${walletAddress}:`);
    console.log(`${balanceInMatic} MATIC`);
    
    if (parseFloat(balanceInMatic) > 0) {
      console.log('✅ You have funds! Ready to deploy contracts.');
    } else {
      console.log('❌ No funds. Please use a faucet to get testnet MATIC.');
    }
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

checkBalance();
