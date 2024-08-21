//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Dappazon {
    string public name;
    address public owner;

    struct Item {
        uint256 id;
        string name;
        string category;
        string image;
        uint256 cost;
        uint256 rating;
        uint256 stock;
    }

    struct Order {
        uint256 time;
        Item item;
    }

    mapping(uint256 => Item) public items;
    mapping(address => uint256) public orderCount;
    mapping(address => mapping(uint256 => Order)) public orders;

    event List(uint256 id, string name, uint256 cost, uint256 quantity);

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor() {
        name = "Dappazon";
        owner = msg.sender;
    }

    // List the products
    function list(
        uint256 _id,
        string memory _name,
        string memory _category,
        string memory _image,
        uint256 _cost,
        uint256 _rating,
        uint256 _stock
    ) public onlyOwner {
        // Create the struct
        Item memory item = Item(
            _id,
            _name,
            _category,
            _image,
            _cost,
            _rating,
            _stock
        );

        // Save the struct to the blockchain
        items[_id] = item;

        // Emit event
        emit List(_id, _name, _cost, _stock);
    }

    // Buy the products
    function Buy(uint256 _id) public payable {
        // Create an order
        Item memory item = items[_id];
        Order memory order = Order(block.timestamp, item);

        // Save order to chain
        orderCount[msg.sender] = orderCount[msg.sender]++;
        orders[msg.sender][orderCount[msg.sender]] = order;

        // Deduct stock

        //Emit event
    }

    // Withdraw funds
}
