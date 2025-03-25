const { ethers, upgrades } = require("hardhat");

async function main() {
    const [owner, user1] = await ethers.getSigners();

    console.log("Deploying contract...");
    const TournamentContract = await ethers.getContractFactory("StoreTournamentLogic");
    const tournament = await upgrades.deployProxy(TournamentContract, [], { initializer: "initialize" });
    console.log("Contract deployed at:", await tournament.getAddress());

    // Simulation des rounds et matchs
    const rounds = [
        {
            roundID: 1,
            matches: [
                { player1: "Francky", player2: "Gerard", scorePlayer1: 3, scorePlayer2: 2 },
                { player1: "Bernard", player2: "Patrick", scorePlayer1: 1, scorePlayer2: 4 }
            ]
        },
        {
            roundID: 2,
            matches: [
                { player1: "Francky", player2: "Patrick", scorePlayer1: 2, scorePlayer2: 3 }
            ]
        }
    ];

    console.log("Storing a full tournament...");
    const tx = await tournament.storeFullTournament(rounds, 1);
    await tx.wait();

    console.log("Tournament stored!");

    // Récupération du tournoi
    console.log("Fetching tournament data...");
    const result = await tournament.getTournament(1);

    console.log("Tournament Data:");
    console.log("Round IDs:", result[0].map(Number));
    console.log("Player 1s:", result[1]);
    console.log("Player 2s:", result[2]);
    console.log("Scores Player 1:", result[3].map(Number));
    console.log("Scores Player 2:", result[4].map(Number));
}

// Exécuter le script
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
