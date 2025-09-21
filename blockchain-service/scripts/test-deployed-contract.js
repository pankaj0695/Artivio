const { ethers } = require('ethers');
require('dotenv').config();

async function debugContract() {
  console.log("🔍 Starting comprehensive contract debug...\n");
  
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
    
    // 1. Check network connection
    console.log("🌐 Testing network connection...");
    const network = await provider.getNetwork();
    console.log("   ✅ Connected to:", network.name, "| Chain ID:", network.chainId);
    
    // 2. Verify environment variables
    console.log("\n📋 Environment Variables:");
    console.log("   Contract Address:", process.env.CONTRACT_ADDRESS || "❌ NOT SET");
    console.log("   RPC URL:", process.env.POLYGON_AMOY_RPC_URL ? "✅ SET" : "❌ NOT SET");
    console.log("   Private Key:", process.env.PRIVATE_KEY ? "✅ SET" : "❌ NOT SET");
    
    if (!process.env.CONTRACT_ADDRESS) {
      console.log("❌ CONTRACT_ADDRESS not found in .env file");
      return;
    }
    
    // 3. Check if address is valid
    if (!ethers.utils.isAddress(process.env.CONTRACT_ADDRESS)) {
      console.log("❌ Invalid contract address format");
      return;
    }
    
    // 4. Check if contract exists
    console.log("\n🔍 Checking contract deployment...");
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const code = await provider.getCode(contractAddress);
    
    console.log("   Contract Address:", contractAddress);
    console.log("   Code Length:", code.length);
    console.log("   Has Contract Code:", code !== "0x" ? "✅ YES" : "❌ NO");
    
    if (code === "0x") {
      console.log("\n❌ No contract found at this address!");
      console.log("   Possible issues:");
      console.log("   - Contract not deployed");
      console.log("   - Wrong network");
      console.log("   - Wrong contract address");
      return;
    }
    
    // 5. Check contract balance
    const balance = await provider.getBalance(contractAddress);
    console.log("   Contract Balance:", ethers.utils.formatEther(balance), "MATIC");
    
    // 6. Try different function calls
    console.log("\n🧪 Testing contract functions...");
    
    const contractABIs = [
      // Standard ERC20/ERC721 functions
      ["function totalSupply() view returns (uint256)", "totalSupply()"],
    ];
    
    for (const [abi, functionName] of contractABIs) {
      try {
        const contract = new ethers.Contract(contractAddress, [abi], provider);
        const result = await contract[functionName.split('(')[0]]();
        console.log(`   ✅ ${functionName}: ${result}`);
      } catch (error) {
        console.log(`   ❌ ${functionName}: ${error.message.split(' ')[0]}`);
      }
    }
    
    // 7. Try to get transaction that created the contract
    console.log("\n🔍 Trying to find deployment transaction...");
    try {
      // This is a simple approach - in practice you'd need the deployment tx hash
      const latestBlock = await provider.getBlockNumber();
      console.log("   Latest block:", latestBlock);
      console.log("   💡 Check block explorer for deployment details");
    } catch (error) {
      console.log("   ❌ Could not fetch block info");
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

// Additional function to test with wallet
async function testWithWallet() {
  console.log("\n👛 Testing with wallet connection...");
  
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("   Wallet Address:", wallet.address);
    
    const balance = await wallet.getBalance();
    console.log("   Wallet Balance:", ethers.utils.formatEther(balance), "MATIC");
    
    if (balance.eq(0)) {
      console.log("   ⚠️ Wallet has no MATIC - might affect contract calls");
    }
    
  } catch (error) {
    console.error("   ❌ Wallet test failed:", error.message);
  }
}

// Run both debug functions
async function main() {
  await debugContract();
  await testWithWallet();
  
  console.log("\n💡 Next steps:");
  console.log("   1. Verify contract is deployed to the correct address");
  console.log("   2. Check you're on the right network (Polygon Amoy)");
  console.log("   3. Verify your contract ABI matches the deployed contract");
  console.log("   4. Check block explorer: https://amoy.polygonscan.com/address/" + process.env.CONTRACT_ADDRESS);
}

main().catch(console.error);
