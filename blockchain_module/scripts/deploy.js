const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("Deploying contract...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contract with account:", deployer.address);
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

    const TournamentContract = await ethers.getContractFactory("StoreTournamentLogic");

    // Estimation du gas
    const gasEstimate = await deployer.estimateGas(TournamentContract.getDeployTransaction());
    console.log("Estimated gas needed:", gasEstimate.toString());

    // Récupération du prix du gas
    const provider = ethers.provider;
    const gasPrice = (await provider.getFeeData()).gasPrice; // gasPrice est maintenant un BigInt
    console.log("Current Gas Price:", gasPrice.toString());

    // Estimation du coût total en ETH, en utilisant l'opérateur *
    const estimatedCost = gasEstimate * gasPrice;
    console.log("Estimated Total Cost in ETH:", ethers.formatEther(estimatedCost));

    // Déploiement du contrat
    const tournament = await upgrades.deployProxy(TournamentContract, [], {
        initializer: "initialize",
        gasPrice: ethers.parseUnits("500", "gwei"),
        timeout: 30000,          // 5 minutes
        pollingInterval: 10000,   // Vérification toutes les 10 sec
    });
    
          
    await tournament.waitForDeployment();
    console.log("Smart contract deployed at:", await tournament.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
