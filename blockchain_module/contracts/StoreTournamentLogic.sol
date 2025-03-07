pragma solidity ^0.8.28;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract StoreTournamentLogic is Initializable {

    address owner; 
    event eventMessage(string _message);

    function initialize() public initializer {

        owner = msg.sender;
        emit eventMessage("The contract has been initialized");
    }
}