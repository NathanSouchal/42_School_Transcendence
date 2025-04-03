const { ethers, upgrades } = require("hardhat");

async function main() {
    const [owner, user1] = await ethers.getSigners();

    const TournamentContract = await ethers.getContractFactory("StoreTournamentLogic");
    const tournament = await upgrades.deployProxy(TournamentContract, [], { initializer: "initialize" });

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

    const tx = await tournament.storeFullTournament(rounds, 1);
    await tx.wait();

    const result = await tournament.getTournament(1);
}

main().catch((error) => {
    process.exit(1);
});
