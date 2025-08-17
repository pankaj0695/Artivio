import { ethers } from 'ethers';
import axios from 'axios';
import dotenv from 'dotenv';
import { spawnSync } from 'child_process';

dotenv.config();

async function testSetup() {
  console.log('🧪 Testing Development Environment Setup...\n');
  
  // Test 1: Environment Variables
  console.log('1️⃣ Testing Environment Variables:');
  console.log('✓ RPC URL:', process.env.POLYGON_AMOY_RPC_URL ? '✅' : '❌');
  console.log('✓ Private Key:', process.env.PRIVATE_KEY ? '✅' : '❌');
  console.log('✓ Pinata JWT:', process.env.PINATA_JWT ? '✅' : '❌');
  console.log('');
  
  // Test 2: Network Connection
  console.log('2️⃣ Testing Network Connection:');
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
    const network = await provider.getNetwork();
    console.log('✅ Connected to:', network.name, `(Chain ID: ${network.chainId})`);
  } catch (error) {
    console.log('❌ Network connection failed:', error.message);
  }
  console.log('');
  
  // Test 3: Wallet Balance
  console.log('3️⃣ Testing Wallet:');
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const balance = await wallet.getBalance();
    const balanceInMatic = ethers.utils.formatEther(balance);
    
    console.log('✓ Wallet Address:', wallet.address);
    console.log('✓ Balance:', `${balanceInMatic} MATIC`);
    
    if (parseFloat(balanceInMatic) >= 0.1) {
      console.log('✅ Sufficient funds for deployment');
    } else {
      console.log('⚠️  Low funds - consider getting more from faucet');
    }
  } catch (error) {
    console.log('❌ Wallet test failed:', error.message);
  }
  console.log('');
  
  // Test 4: IPFS Connection
  console.log('4️⃣ Testing IPFS (Pinata):');
  try {
    const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`
      }
    });
    console.log('✅ Pinata authentication successful');
    console.log('✓ Message:', response.data.message);
  } catch (error) {
    console.log('❌ Pinata test failed:', error.response?.data?.error || error.message);
  }
  console.log('');
  
  // Test 5: Hardhat
  console.log('5️⃣ Testing Hardhat:');
  try {
  const result = spawnSync("npx", ["hardhat", "--version"], {
    encoding: "utf-8", 
    shell: true  
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status === 0) {
    console.log("✅ Hardhat version:", result.stdout.trim());
    console.log("✅ Hardhat working correctly");
  } else {
    console.error("❌ Hardhat test failed:", result.stderr.trim());
  }
} catch (error) {
  console.error("❌ Hardhat test failed:", error.message);
}
  
  console.log('');
  console.log('🎉 Setup test completed!');
  console.log('');
  console.log('📋 Summary:');
  console.log('- If all tests show ✅, you\'re ready to go!');
  console.log('- If any test shows ❌, check the README.md of this service and make sure all steps are covered');
  console.log('- If you have low funds, get more from the faucets');
}

testSetup();
