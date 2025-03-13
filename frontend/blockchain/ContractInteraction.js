import { ethers } from "ethers";
import TournamentABI from "./ContractStoreTournamentABI.json";

const CONTRACT_ABI = TournamentABI.abi;
const CONTRACT_ADDRESS = "0xB68419ae2A9b666d5bCF983a87567a4F0ED95Bb4";

export async function connectWallet() {
    if (!window.ethereum) {
        alert("Please install Metamask");
        return null;
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        return accounts[0]; // Adresse Ethereum de l'utilisateur connecté
    } catch (error) {
        console.error("Error during Metamask connexion :", error);
        return null;
    }
}

function getContract(signer) {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export async function storeTournament(rounds, tournamentId) {
    if (!window.ethereum) {
        alert("Metamask is required !");
        return;
    }

    try {
        // Connexion au provider et récupération du signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        console.log("Metamask account utilisé :", await signer.getAddress());
        const contract = getContract(signer);

        // Envoyer la transaction
        const tx = await contract.storeFullTournament(rounds, tournamentId, {
            gasLimit: 500000
        });        
        console.log("Transaction send :", tx.hash);

        await tx.wait(); // Attente de la confirmation
        console.log("Tournament's score stored on the blockchain");
        return true;
    } catch (error) {
        console.error("Error during tournament registration :", error);
        return false;
    }
}


export async function getTournament(tournamentId) {
    if (!window.ethereum) {
        alert("Metamask is required");
        return;
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = getContract(provider);

        const result = await contract.getTournament(tournamentId);

        return {
            roundIDs: result[0].map(Number),
            player1s: result[1],
            player2s: result[2],
            scorePlayer1s: result[3].map(Number),
            scorePlayer2s: result[4].map(Number),
        };
    } catch (error) {
        console.error("Error during tournament recovery :", error);
        return null;
    }
}
