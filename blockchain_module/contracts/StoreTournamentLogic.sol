pragma solidity ^0.8.28;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract StoreTournamentLogic is Initializable {

    address private _owner; 
    event   ContractInitialized(address owner);
    event   TournamentStored(uint tournamentId, address submittedBy);
    event Debug(string message, uint value);
    event DebugAddress(string message, address sender);

    struct  TournamentMatch {
        string  player1;
        string  player2;
        uint    scorePlayer1;
        uint    scorePlayer2;
    }
    struct  Round {
        uint                roundID;
        TournamentMatch[]   matches;
    }
    mapping(uint => Round[]) public allTournamentsScores;

    function initialize() public initializer {
        _owner = msg.sender;
        emit ContractInitialized(_owner);
    }

    //Ici on ne peut pas directement stocker _round dans allTournamentsScores, car stocker un struct[] qui est en memory dans un mapping qui est en storage n'est pas possible
    function _storeRound(Round memory _round, uint _tournamentId) private {
    emit Debug("Entree dans _storeRound", _round.roundID);

    Round storage newRound = allTournamentsScores[_tournamentId].push();
    newRound.roundID = _round.roundID;

    for (uint i = 0; i < _round.matches.length; i++) {
        emit Debug("Ajout du match", i);
        newRound.matches.push(_round.matches[i]);
    }
}


    function storeFullTournament(Round[] memory rounds, uint tournamentId) public {
    emit Debug("Debut de storeFullTournament", tournamentId);
    emit DebugAddress("Transaction envoyee par", msg.sender);

    require(rounds.length > 0, "Tournament must have at least one round.");
    emit Debug("Nombre de rounds recus", rounds.length);

    for (uint i = 0; i < rounds.length; i++) {
        emit Debug("Traitement du round", rounds[i].roundID);
        _storeRound(rounds[i], tournamentId);
    }

    emit TournamentStored(tournamentId, msg.sender);
}


    function getTournament(uint tournamentId) public view 
    returns(uint[] memory roundIDs, string[] memory player1s, string[] memory player2s, uint[] memory scorePlayer1s, uint[] memory scorePlayer2s) {
        Round[] memory rounds = allTournamentsScores[tournamentId];
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