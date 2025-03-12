const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("Déploiement du contrat sur le réseau local...");

    // Récupérer le compte de déploiement
    const [deployer] = await ethers.getSigners();
    console.log("Déployé par :", deployer.address);

    // Déployer le contrat
    const TournamentContract = await ethers.getContractFactory("StoreTournamentLogic");
    const tournament = await upgrades.deployProxy(TournamentContract, [], { initializer: "initialize" });

    await tournament.waitForDeployment();
    const contractAddress = await tournament.getAddress();
    console.log("Contrat déployé à l'adresse :", contractAddress);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
