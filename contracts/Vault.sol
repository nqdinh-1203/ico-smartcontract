// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract Vault is Ownable, AccessControlEnumerable {
    IERC20 private token;
    uint256 public maxWithdrawAmount; // số tiền tối đa user có thể rút
    bool public withdrawEnable; // quyền được rút tiền
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    function getTokenAddress() public view returns (address) {
        return address(token);
    }

    function setWithdrawEnable(bool _isEnable) public onlyOwner {
        withdrawEnable = _isEnable;
    }

    function setMaxWithdrawAmount(uint256 _maxAmount) public onlyOwner {
        maxWithdrawAmount = _maxAmount;
    }

    function setToken(IERC20 _token) public onlyOwner {
        token = _token;
    }

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    modifier onlyWithdrawer() {
        require(
            owner() == _msgSender() || hasRole(WITHDRAWER_ROLE, _msgSender()),
            "Caller is not a withdrawer"
        );
        _;
    }

    function withdraw(address _to, uint256 _amount) external onlyWithdrawer {
        require(withdrawEnable, "Withdraw is not available");
        require(_amount <= maxWithdrawAmount, "Exceed maximum amount");

        token.transfer(_to, _amount);
    }

    function deposit(uint256 _amount) external {
        require(
            token.balanceOf(msg.sender) >= _amount,
            "Insufficient account balance"
        );
        SafeERC20.safeTransferFrom(token, _msgSender(), address(this), _amount);
    }
}
