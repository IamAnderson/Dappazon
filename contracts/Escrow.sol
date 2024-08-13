//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
}

contract Escrow {
    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;

    modifier onlySeller() {
        require(msg.sender == seller, "Only owner can do this");
        _;
    }

    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can do this");
        _;
    }

    modifier onlyInspector() {
        require(
            msg.sender == inspector,
            "Only inspector can call this function"
        );
        _;
    }

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice; // Total price of property
    mapping(uint256 => uint256) public escrowAmount; // This is down payment the seller holds
    mapping(uint256 => address) public buyer;

    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval; // This returns bool when the property has been inspected and approved by an inspector

    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }

    function list(
        uint256 _nftID,
        uint256 _purchasePrice,
        address _buyer,
        uint256 _escrowAmount
    ) public payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;
    }

    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID) {
        require(
            msg.value >= escrowAmount[_nftID],
            "Deposit must be >= escrow amount"
        );
    }

    function updateInspectionStatus(
        uint256 _nftID,
        bool _passed
    ) public onlyInspector {
        require(msg.sender != seller, "Cannot inspect your own property");
        inspectionPassed[_nftID] = _passed;
    }

    function approveSale(uint256 _nftID) public {
        require(
            inspectionPassed[_nftID],
            "Property inspection has not been passed"
        );
        approval[_nftID][msg.sender] = true;
    }

    function finalizeSale(uint256 _nftID) public {
        require(
            inspectionPassed[_nftID],
            "Property inspection has not been passed"
        );
        require(
            approval[_nftID][buyer[_nftID]],
            "Property sale needs to be approved by buyer"
        );
        require(
            approval[_nftID][seller],
            "Property sale needs to be approved by seller"
        );
        require(
            approval[_nftID][lender],
            "Property sale needs to be approved by lender"
        );
        require(
            address(this).balance >= purchasePrice[_nftID],
            "Escrow balance should be >= purchase price"
        );

        // Transfter escrow balance to seller
        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success, "Failed to transfer escrow balance to seller");

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

    function cancelSale(uint256 _nftID) public {
        require(isListed[_nftID], "Property is not listed");
        require(
            msg.sender == buyer[_nftID] || msg.sender == seller,
            "Only buyer or seller can cancel the sale"
        );

        if (inspectionPassed[_nftID]) {
            require(
                msg.sender == seller,
                "Only seller can cancel after inspection passed"
            );
        }

        // Reset approval status
        approval[_nftID][buyer[_nftID]] = false;
        approval[_nftID][seller] = false;
        approval[_nftID][lender] = false;

        // Transfer NFT back to seller
        IERC721(nftAddress).transferFrom(address(this), seller, _nftID);

        // Refund buyer
        if (address(this).balance > 0) {
            payable(buyer[_nftID]).transfer(address(this).balance);
        }

        // Reset listing status and related mappings
        isListed[_nftID] = false;
        purchasePrice[_nftID] = 0;
        escrowAmount[_nftID] = 0;
        buyer[_nftID] = address(0);
        inspectionPassed[_nftID] = false;
    }

    receive() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
