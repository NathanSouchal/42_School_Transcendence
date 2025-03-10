pragma solidity ^0.8.28;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract StoreTournamentLogic is Initializable {

    address owner; 
    event   ContractInitialized(address _owner);
    event   TournamentStored(uint _tournamentID, address _submittedBy);
    struct  tournamentMatch {
        string  player1;
        string  player2;
        uint    scorePlayer1;
        uint    scorePlayer2;
    }
    struct  round {
        uint                roundID;
        tournamentMatch[]   matches;
    }
    mapping(uint => round[]) public allTournamentsScores;

    function initialize() public initializer {
        owner = msg.sender;
        emit ContractInitialized(owner);
    }

    function storeRound(round memory _round, uint _tournamentID) private {
        allTournamentsScores[_tournamentID].push(_round);
    }

    function storeFullTournament(round[] memory _rounds, uint _tournamentID) public {
        require(_rounds.length > 0, "Tournament must have at least one round.");
        for (uint i = 0; i < _rounds.length; i++) {
            storeRound(_rounds[i], _tournamentID);
        }
        emit TournamentStored(_tournamentID, msg.sender);
    }

    function getTournament(uint _tournamentID) public view 
    returns(uint[] memory roundIDs, string[] memory player1s, string[] memory player2s, uint[] memory scorePlayer1s, uint[] memory scorePlayer2s) {
        round[] memory rounds = allTournamentsScores[_tournamentID];
        uint totalTournamentMatches = 0;
        uint matchIndex = 0;

        for (uint i = 0; i < rounds.length; i++) {
            totalTournamentMatches += rounds[i].matches.length;
        }

        roundIDs = new uint[](totalTournamentMatches);
        player1s = new string[](totalTournamentMatches);
        player2s = new string[](totalTournamentMatches);
        scorePlayer1s = new uint[](totalTournamentMatches);
        scorePlayer2s = new uint[](totalTournamentMatches);

        for (uint i = 0; i < rounds.length; i++) {
            for (uint j = 0; j < rounds[i].matches.length; j++) {
                roundIDs[matchIndex] = rounds[i].roundID;
                player1s[matchIndex] = rounds[i].matches[j].player1;
                player2s[matchIndex] = rounds[i].matches[j].player2;
                scorePlayer1s[matchIndex] = rounds[i].matches[j].scorePlayer1;
                scorePlayer2s[matchIndex] = rounds[i].matches[j].scorePlayer2;
                matchIndex++;
            }
        }
    }
}