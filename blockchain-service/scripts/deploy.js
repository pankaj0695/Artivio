const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the contract
  const ArtisanRights1155 = await ethers.getContractFactory("ArtisanRights1155");
  const contract = await ArtisanRights1155.deploy(
    "https://api.yourapp.com/metadata/", // Base URI - update this
    deployer.address, // Admin
    deployer.address  // Minter (same as admin for simplicity)
  );

  await contract.deployed();
  console.log("ArtisanRights1155 deployed to:", contract.address);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contractAddress: contract.address,
    deployerAddress: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString()
  };
  
  console.log("Deployment info:", deploymentInfo);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
