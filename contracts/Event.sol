pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Strings.sol";

struct Participant {
    address payable addr;
    bool assisted;
    bool refunded;
    bool created;
}

contract Event {

    event NewParticipant(address sender);
    event ParticipantWithdraw(address sender);

    address private _owner;
    bool private _flagEventClosed = false;
    uint private _amountToRefund;

    uint private _eventTime;
    uint private _fee;

    mapping (address => Participant) private participants;
    uint nParticipants;

    modifier onlyOwner () {
        require(msg.sender == _owner, "Not owner");
        _;
    }

    constructor(uint eventTime, uint fee) {
        _owner = msg.sender;
        _eventTime = eventTime;
        _fee = fee;
    }

    function assist() external payable {
        require(msg.value == _fee, string.concat("Necessary to send ", Strings.toString(_fee)));
        require(block.timestamp < _eventTime, "Event started already you cannot assist.");
        require(participants[msg.sender].created == true, "You already are comming!");

        participants[msg.sender] = Participant({ addr: payable(msg.sender), assisted: false, refunded: false, created: true});
        nParticipants += 1;
        emit NewParticipant(msg.sender);
    }

    function confirmAssistance(address addr) public onlyOwner {
        participants[addr].assisted = true;
    }

    function closeEvent() public onlyOwner {
        _flagEventClosed = true;
        _amountToRefund = address(this).balance / nParticipants;
    }

    function withdraw() public {
        require(_flagEventClosed == true, "Event still not closed");
        require(participants[msg.sender].created == true, "You didn't signup for the event");
        require(participants[msg.sender].assisted == true, "You didn't come to the event");
        require(participants[msg.sender].refunded == false, "You were already refunded");

        payable(msg.sender).transfer(_amountToRefund);
        participants[msg.sender].refunded = true;
        emit ParticipantWithdraw(msg.sender);
    }
}