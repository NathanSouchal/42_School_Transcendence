const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    const TournamentContract = await ethers.getContractFactory("StoreTournamentLogic");
    const tournament = await upgrades.deployProxy(TournamentContract, [], { initializer: "initialize" });

    await tournament.waitForDeployment();
    const contractAddress = await tournament.getAddress();
}

main().catch((error) => {
    process.exit(1);
});
