pragma experimental ABIEncoderV2;
pragma solidity >=0.5.5 <0.6.0;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";


contract HashedTimeLockContract {
    using SafeERC20 for IERC20;

    mapping(bytes32 => LockContract) public contracts;

    //                   / - WITHDRAWN
    // INVALID - ACTIVE |
    //                   \ - EXPIRED - REFUNDED

    uint256 public constant INVALID = 0; // Uninitialized  swap -> can go to ACTIVE
    uint256 public constant ACTIVE = 1; // Active swap -> can go to WITHDRAWN or EXPIRED
    uint256 public constant REFUNDED = 2; // Swap is refunded -> final state.
    uint256 public constant WITHDRAWN = 3; // Swap is withdrawn -> final state.
    uint256 public constant EXPIRED = 4; // Swap is expired -> can go to REFUNDED

    struct LockContract {
        uint256 inputAmount;
        uint256 outputAmount;
        uint256 expiration;
        uint256 status;
        bytes32 hashLock;
        address tokenAddress;
        address sender;
        address receiver;
        string outputNetwork;
        string outputAddress;
    }

    event Withdraw(
        bytes32 id,
        bytes32 secret,
        bytes32 hashLock,
        address indexed tokenAddress,
        address indexed sender,
        address indexed receiver
    );

    event Refund(
        bytes32 id,
        bytes32 hashLock,
        address indexed tokenAddress,
        address indexed sender,
        address indexed receiver
    );

    event NewContract(
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 expiration,
        bytes32 id,
        bytes32 hashLock,
        address indexed tokenAddress,
        address indexed sender,
        address indexed receiver,
        string outputNetwork,
        string outputAddress
    );

    function newContract(
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 expiration,
        bytes32 hashLock,
        address tokenAddress,
        address receiver,
        string calldata outputNetwork,
        string calldata outputAddress
    ) external {
        require(expiration > block.timestamp, "INVALID_TIME");

        require(inputAmount > 0, "INVALID_AMOUNT");

        IERC20(tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            inputAmount
        );

        bytes32 id = sha256(
            abi.encodePacked(
                msg.sender,
                receiver,
                inputAmount,
                hashLock,
                expiration,
                tokenAddress
            )
        );

        require(contracts[id].status == INVALID, "SWAP_EXISTS");

        contracts[id] = LockContract(
            inputAmount,
            outputAmount,
            expiration,
            ACTIVE,
            hashLock,
            tokenAddress,
            msg.sender,
            receiver,
            outputNetwork,
            outputAddress
        );

        emit NewContract(
            inputAmount,
            outputAmount,
            expiration,
            id,
            hashLock,
            tokenAddress,
            msg.sender,
            receiver,
            outputNetwork,
            outputAddress
        );
    }

    function withdraw(bytes32 id, bytes32 secret, address tokenAddress)
        external
    {
        LockContract storage c = contracts[id];

        require(c.tokenAddress == tokenAddress, "INVALID_TOKEN");

        require(c.status == ACTIVE, "SWAP_NOT_ACTIVE");

        require(c.expiration > block.timestamp, "INVALID_TIME");

        require(
            c.hashLock == sha256(abi.encodePacked(secret)),
            "INVALID_SECRET"
        );

        c.status = WITHDRAWN;

        IERC20(tokenAddress).safeTransfer(c.receiver, c.inputAmount);

        emit Withdraw(
            id,
            secret,
            c.hashLock,
            tokenAddress,
            c.sender,
            c.receiver
        );
    }

    function refund(bytes32 id, address tokenAddress) external {
        LockContract storage c = contracts[id];

        require(c.tokenAddress == tokenAddress, "INVALID_TOKEN");

        require(c.status == ACTIVE, "SWAP_NOT_ACTIVE");

        require(c.expiration <= block.timestamp, "INVALID_TIME");

        c.status = REFUNDED;

        IERC20(tokenAddress).safeTransfer(c.sender, c.inputAmount);

        emit Refund(id, c.hashLock, tokenAddress, c.sender, c.receiver);
    }

    function getStatus(bytes32[] memory ids)
        public
        view
        returns (uint256[] memory)
    {
        uint256[] memory result = new uint256[](ids.length);

        for (uint256 index = 0; index < ids.length; index++) {
            result[index] = getSingleStatus(ids[index]);
        }

        return result;
    }

    function getSingleStatus(bytes32 id) public view returns (uint256 result) {
        LockContract memory tempContract = contracts[id];

        if (
            tempContract.status == ACTIVE &&
            tempContract.expiration < block.timestamp
        ) {
            result = EXPIRED;
        } else {
            result = tempContract.status;
        }
    }
}
