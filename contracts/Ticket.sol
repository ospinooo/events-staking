pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Ticket is ERC721, Ownable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    event TicketBought(address buyer, uint256 indexed ticketId);
    event WithdrawNonAssistants();
    event TicketBurnt(address burner, uint256 indexed ticketId);

    Counters.Counter private _ticketIds;

    uint256 public maxSupply;
    uint256 public price;
    uint256 public eventTime;

    mapping(uint256 => int8) assisted; // 1,0,-1
    Counters.Counter private _assisted;
    Counters.Counter private _burnts;

    constructor(
        uint256 _maxSupply,
        uint256 _price,
        uint256 _eventTime
    ) ERC721("Ticket", "T") {
        maxSupply = _maxSupply;
        price = _price;
        eventTime = _eventTime;
    }

    function assist(uint256 ticketId) public onlyOwner {
        require(assisted[ticketId] != 1, "Token already assisted");
        require(assisted[ticketId] == -1, "Token doesnt exist");
        assisted[ticketId] = 1;
        _assisted.increment();
    }

    function withdraw() public onlyOwner {
        require(block.timestamp > eventTime, "Too soon to withdraw tickets");
        uint256 notAssistedTickets = _ticketIds.current().sub(
            _assisted.current()
        );
        payable(msg.sender).transfer(notAssistedTickets.mul(price));
        emit WithdrawNonAssistants();
    }

    function buyTicket() external payable returns (uint256) {
        require(_ticketIds.current() < maxSupply, "No more tickets available");
        require(
            price == uint256(msg.value),
            "Value sent doesnt match with price of ticket"
        );
        require(block.timestamp < eventTime, "Too late to buy tickets");
        uint256 newItemId = _ticketIds.current();
        _mint(address(msg.sender), newItemId);
        assisted[newItemId] = -1;
        _ticketIds.increment();
        emit TicketBought(msg.sender, newItemId);
        return newItemId;
    }

    function burn(uint256 ticketId) external {
        require(assisted[ticketId] == 1, "Ticket didn't assist");
        require(
            _isApprovedOrOwner(_msgSender(), ticketId),
            "Caller is not token owner or approved"
        );
        _burn(ticketId);
        _burnts.increment();
        payable(msg.sender).transfer(price);
        emit TicketBurnt(msg.sender, ticketId);
    }
}
