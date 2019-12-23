import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token used for testing
 */
contract SimpleToken is ERC20, ERC20Detailed {
    uint8 public constant DECIMALS = 18;
    constructor () public ERC20Detailed("SimpleToken", "SIM", DECIMALS) { }
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}