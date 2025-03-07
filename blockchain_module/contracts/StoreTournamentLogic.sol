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
        bool    isValid;
    }
    struct  round {
        uint                roundID;
        tournamentMatch[]   matches;
    }
    // mapping(tournamentID => mapping(roundID => array of struct tournamentMatch))
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
}