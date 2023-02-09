// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Token is ERC20, Ownable, ERC20Burnable {
    uint256 private capacity = 50_000_000_000 * 10 ** uint256(18);
    uint256 private initAmount = 1_000_000 * 10 ** uint256(18);

    constructor() ERC20("Pepe Coin", "PPC") {
        _mint(msg.sender, initAmount);
        transferOwnership(msg.sender);
    }

    function mint(address _to, uint256 _amount) public onlyOwner {
        require(
            totalSupply() + _amount <= capacity,
            "Pepe Coin: capacity exceeded"
        );
        _mint(_to, _amount);
    }
}
