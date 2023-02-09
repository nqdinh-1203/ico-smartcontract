// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract USDT is ERC20("USD Token", "USDT"), ERC20Burnable, Ownable {
    uint256 private capacity = 50_000_000_000 * 10 ** uint256(18);
    uint256 private initAmount = 1_000_000 * 10 ** uint256(18);

    constructor() {
        console.log("Owner: %s, Max Capacity: %s", msg.sender, capacity);
        _mint(msg.sender, initAmount);
        transferOwnership(msg.sender);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(ERC20.totalSupply() + amount <= capacity, "USDT: No exceeded");
        _mint(to, amount);
    }
}
