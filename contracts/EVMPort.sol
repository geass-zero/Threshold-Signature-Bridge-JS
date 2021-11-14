pragma solidity ^0.8.4;

library SafeMath {

    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        uint256 c = a + b;
        if (c < a) return (false, 0);
        return (true, c);
    }

    /**
     * @dev Returns the substraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        if (b > a) return (false, 0);
        return (true, a - b);
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) return (true, 0);
        uint256 c = a * b;
        if (c / a != b) return (false, 0);
        return (true, c);
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        if (b == 0) return (false, 0);
        return (true, a / b);
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * 
     * _Available since v3.4._
     */
    function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        if (b == 0) return (false, 0);
        return (true, a % b);
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) return 0;
        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: division by zero");
        return a / b;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: modulo by zero");
        return a % b;
    }
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address payable) {
        return payable(msg.sender);
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}


// File: contracts/IUniswapV2Router.sol


interface IUniswapV2Router01 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountToken, uint amountETH);
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);

    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
}



// pragma solidity >=0.8.4;

interface IUniswapV2Router02 is IUniswapV2Router01 {
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountETH);
    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountETH);

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}


/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
contract Ownable is Context {
    address private _owner;
    address private _previousOwner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }
    
    function setOwnableConstructor() internal {
        address msgSender = _msgSender();
        _owner = msgSender;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

     /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    
}

contract Proxiable {
    // Code position in storage is keccak256("PROXIABLE") = "0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7"

    function updateCodeAddress(address newAddress) internal {
        require(
            bytes32(0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7) == Proxiable(newAddress).proxiableUUID(),
            "Not compatible"
        );
        assembly { // solium-disable-line
            sstore(0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7, newAddress)
        }
    }
    function proxiableUUID() public pure returns (bytes32) {
        return 0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7;
    }
}

contract LibraryLockDataLayout {
  bool public initialized = false;
}

contract LibraryLock is LibraryLockDataLayout {
    // Ensures no one can manipulate the Logic Contract once it is deployed.
    // PARITY WALLET HACK PREVENTION

    modifier delegatedOnly() {
        require(initialized == true, "The library is locked. No direct 'call' is allowed");
        _;
    }
    function initialize() internal {
        initialized = true;
    }
}

contract DataLayout is LibraryLock {
    string public startChain;
    uint public chainId;
    uint256 public nonce;
    uint public threshold;
    mapping(address => bool) public isValidSigner;
    address[] public signersArr;
    
    //transactions being sent to contracts on external chains
    uint256 public outboundIndex;
    struct outboundTransactions {
        address sender;
        uint256 feeAmount;
        address destination;
        string chain;
        string preferredNode;
        address startContract;
    }
    mapping(uint256 => outboundTransactions) public outboundHistory;
    
    //transactions being sent to contracts on local chain
    uint256 public inboundIndex;
    struct inboundTransactions {
        uint256 amount;
        address sender;
        address recipient;
        string chain;
    }
    mapping(uint256 => inboundTransactions) public inboundHistory;
    
    mapping(address => bool) public allowedContracts;
    
    address public bridgeAddress;
    
    IUniswapV2Router02 public router;
    address public localStableToken;
    mapping(uint256 => mapping(address => bool)) public signHistory;
    address public foundationWallet;
    mapping(string => uint256) public priceMapping;
    mapping(bytes32 => bool) public usedHashes;
}

contract PortContract is Ownable, Proxiable, DataLayout {
    using SafeMath for uint256;
    using SafeMath for uint32;
    
    constructor () {
 
    }

    function proxyConstructor(string memory _startChain, uint _threshold, uint _chainId) public {
        require(!initialized, "Contract is already initialized");
        setOwnableConstructor();
        startChain = _startChain;
        threshold = _threshold;
        chainId = _chainId;
        initialize();
    }

    function updateCode(address newCode) public onlyOwner delegatedOnly  {
        updateCodeAddress(newCode);
    }

    receive() external payable {

  	}
    
    event BridgeSwapOut(
        address sender,
        address destination,
        string startChain,
        string endChain,
        string preferredNode,
        uint256 feeAmount,
        address startContract,
        address[] addresses,
        uint256[] numbers,
        string[] strings,
        bool[] bools,
        bytes32[] bytesArr
    );

    event BridgeSwapIn(
        string startChain,
        address sender,
        address destination,
    );

    modifier onlyBridge {
        require(msg.sender == bridgeAddress);
        _;
    }
    
    modifier onlyAllowed {
        require(allowedContracts[msg.sender]);
        _;
    }
    
    function setThreshold(uint _threshold) public onlyOwner {
        threshold = _threshold;
    }
    
    function setBridgeAddress(address _address) public onlyOwner {
        bridgeAddress = _address;
    }
    
    function setChainId(uint _chainId) public onlyOwner {
        chainId = _chainId;
    }
    
    function setContractStatus(address _contract, bool status) public onlyOwner {
        allowedContracts[_contract] = status;
    }
    
    function setFoundationWallet(address _wallet) public onlyOwner {
        foundationWallet = _wallet;
    }
    
    
    function setPriceMapping(string memory chain, uint256 price) public onlyOwner {
        priceMapping[chain] = price;
    }
        
    function addSigner(address[] memory _signers) public onlyOwner {
        for (uint i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "0 Address cannot be a signer");
            require(!isValidSigner[_signers[i]], "New signer cannot be an existing signer");
            isValidSigner[_signers[i]] = true;
            signersArr.push(_signers[i]);
        }
    }
    
    function outboundSwap(
        address sender,
        address destination,
        address[] memory addresses, uint256[] memory numbers, 
        string[] memory strings, bool[] memory bools, 
        bytes32[] memory bytesArr,
        string memory endChain,
        string memory preferredNode) public payable {
            require(msg.value > 0, "Fee amount must be greater than 0");
            outboundIndex = outboundIndex.add(1);
            outboundHistory[outboundIndex].sender = sender;
            outboundHistory[outboundIndex].feeAmount = msg.value;
            outboundHistory[outboundIndex].startContract = msg.sender;
            outboundHistory[outboundIndex].destination = destination;
            outboundHistory[outboundIndex].chain = endChain;
            outboundHistory[outboundIndex].preferredNode = preferredNode;
            require(msg.value >= priceMapping[endChain], "Minimum bridge fee required");
            payable(foundationWallet).transfer(msg.value);
            
            emit BridgeSwapOut(
                sender, destination, 
                startChain, endChain, 
                preferredNode, msg.value, msg.sender,
                addresses, numbers, strings, bools, bytesArr);
    }
    
    function determineFeeInCoin(string memory endChain) public view returns(uint256) {
        //return getEstimatedStableforCoin(priceMapping[endChain])[0];
        return priceMapping[endChain];
    }
    
    function getEstimatedStableforCoin(uint coinAmount) public view returns (uint[] memory) {
        return router.getAmountsIn(coinAmount, getPathForCointoStable());
    }

    function getPathForCointoStable() private view returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = localStableToken;
        
        return path;
    }
    
    function inboundSwap(
        string memory _startChain,
        address sender,
        address destination,
        address[] memory addresses, uint256[] memory numbers, string[] memory strings, bool[] memory bools, bytes32[] memory bytesArr) internal {
        
        inboundIndex = inboundIndex.add(1);
        inboundHistory[inboundIndex].sender = sender;
        inboundHistory[inboundIndex].destination = destination;
        inboundHistory[inboundIndex].chain = _startChain;
        
        DestinationContract(destination).portMessage(addresses, numbers, strings, bools, bytesArr);
        emit BridgeSwapIn(startChain, sender, recipient, amount);
    }
    

    // Note that address recovered from signatures must be strictly increasing, in order to prevent duplicates
    function execute(
        string memory _startChain,
        address sender,
        address destination,
        address[] memory addresses, uint256[] memory numbers, string[] memory strings, bool[] memory bools, bytes32[] memory bytesArr,
        uint8[] memory sigV, bytes32[] memory sigR, bytes32[] memory sigS, bytes32[] memory hashes) public {
        require(sigR.length >= threshold, "sigR must meet or exceed threshold");
        require(sigR.length == sigS.length && sigR.length == sigV.length, "sigR length must equal sigS");
        require(isValidSigner[msg.sender], "Caller must be a valid signer");
        require(!usedHashes[hashes[0]], "Invalid hash");

  
        for (uint i = 0; i < threshold; i++) {
            address recovered = ecrecover(hashes[0], sigV[i], sigR[i], sigS[i]);
            require(!signHistory[nonce][recovered] && isValidSigner[recovered], "Invalid signer");
            signHistory[nonce][recovered] = true;
        }

        usedHashes[hashes[0]] = true;
        nonce = nonce + 1;
        inboundSwap(_startChain, sender, destination, addresses, numbers, strings, bools, bytesArr);
    }
    
}

interface DestinationContract {
    function portMessage(address[] memory addresses, uint256[] memory numbers, string[] memory strings, bool[] memory bools, bytes32[] memory bytesArr) external;
}