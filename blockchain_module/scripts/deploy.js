const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const balance = await deployer.provider.getBalance(deployer.address);

    const TournamentContract = await ethers.getContractFactory("StoreTournamentLogic");

    const gasEstimate = await deployer.estimateGas(TournamentContract.getDeployTransaction());

    const provider = ethers.provider;
    const gasPrice = (await provider.getFeeData()).gasPrice;

    const estimatedCost = gasEstimate * gasPrice;

    const tournament = await upgrades.deployProxy(TournamentContract, [], {
        initializer: "initialize",
        timeout: 30000,
        pollingInterval: 10000,
    });


    await tournament.waitForDeployment();
}

main().catch((error) => {
    process.exit(1);
});
