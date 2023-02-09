// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PPCrowndSale is Ownable {
    using SafeERC20 for IERC20;
    address payable public _wallet;
    uint256 public ETH_rate;
    uint256 public USDT_rate;
    IERC20 public token;
    IERC20 public usdtToken;

    event ByTokenByETH(address buyer, uint256 amount);
    event ByTokenByUSDT(address buyer, uint256 amount);
    event SetUSDTToken(IERC20 tokenAddress);
    event SetETHRate(uint256 newRate);
    event SetUSDTRate(uint256 newRate);

    constructor(
        uint256 eth_rate,
        uint256 usdt_rate,
        address payable wallet,
        IERC20 icotoken
    ) {
        ETH_rate = eth_rate;
        USDT_rate = usdt_rate;
        _wallet = wallet;
        token = icotoken;
    }

    function setUSDTToken(IERC20 token_address) public onlyOwner {
        usdtToken = token_address;
        emit SetUSDTToken(token_address);
    }

    function setUSDTRate(uint256 new_rate) public onlyOwner {
        USDT_rate = new_rate;
        emit SetUSDTRate(new_rate);
    }

    function setETHRate(uint256 new_rate) public onlyOwner {
        ETH_rate = new_rate;
        emit SetETHRate(new_rate);
    }

    function getTokenAmountETH(
        uint256 ETHAmount
    ) public view returns (uint256) {
        return ETHAmount * ETH_rate;
    }

    function getTokenAmountUSDT(
        uint256 USDTAmount
    ) public view returns (uint256) {
        return USDTAmount * USDT_rate;
    }

    function buyTokenByETH() external payable {
        uint256 ethAmount = msg.value;
        uint256 amount = getTokenAmountETH(ethAmount);

        // Kiểm tra amount nên lớn hơn 0
        require(amount > 0, "Amount is zero");

        // Kiểm tra số dư token trong ico >= amount
        require(
            token.balanceOf(address(this)) >= amount,
            "Insufficient account balance"
        );

        // chuyển tiền ETH vào vào ví được set
        payable(_wallet).transfer(ethAmount);
        // chuyển số lương token vào
        SafeERC20.safeTransfer(token, msg.sender, amount);

        // bắn event
        emit ByTokenByETH(msg.sender, amount);
    }

    function buyTokenByUSDT(uint256 USDTAmount) external {
        uint256 amount = getTokenAmountUSDT(USDTAmount);

        require(
            usdtToken.balanceOf(msg.sender) >= USDTAmount,
            "Insufficient USDT in account balance"
        );
        require(
            token.balanceOf(address(this)) >= amount,
            "Insufficient token in Contract balance"
        );
        require(amount > 0, "Amount is zero");

        SafeERC20.safeTransferFrom(usdtToken, msg.sender, _wallet, USDTAmount);
        SafeERC20.safeTransfer(token, msg.sender, amount);
        emit ByTokenByETH(msg.sender, amount);
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawERC20() public onlyOwner {
        usdtToken.transfer(msg.sender, usdtToken.balanceOf(address(this)));
    }
}
