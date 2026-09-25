// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TicketContract {
    address public owner;
    uint256 public totalClaimed;    

    struct Ticket {
        address holder;
        uint256 claimDate;
        bool isValid;
    }

    // Menyimpan data tiket berdasarkan address dompet user
    mapping(address => Ticket) public tickets;

    event TicketClaimed(address indexed user);

    constructor() {
        owner = msg.sender;
    }

    // Fungsi utama yang bakal dipanggil saat user klik tombol klaim di web
    function claimTicket() public {
        // Mencegah dompet yang sama nge-klaim tiket lebih dari sekali
        require(!tickets[msg.sender].isValid, "Dompet ini sudah klaim tiket!");

        tickets[msg.sender] = Ticket(
            msg.sender,
            block.timestamp,
            true
        );

        totalClaimed += 1; // Menambah jumlah kapasitas tiket yang sudah terklaim
        emit TicketClaimed(msg.sender);
    }

    // Fungsi untuk mengecek apakah suatu dompet punya tiket yang valid
    function verifyTicket(address userAddress) public view returns (bool) {
        return tickets[userAddress].isValid;
    }
}