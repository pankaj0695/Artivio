const { ethers } = require('ethers');
require('dotenv').config();

async function testContract() {
  console.log("🧪 Testing deployed contract...");
  
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Contract ABI (minimal for testing)
  const contractABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function owner() view returns (address)"
  ];
  
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    contractABI,
    wallet
  );
  
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    const owner = await contract.owner();
    
    console.log("✅ Contract is live!");
    console.log("📋 Name:", name);
    console.log("📋 Symbol:", symbol);
    console.log("📋 Owner:", owner);
    
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
  }
}

testContract();
