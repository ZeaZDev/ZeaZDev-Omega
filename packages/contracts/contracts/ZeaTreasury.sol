/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Smart-Contracts-Treasury
 * @File: ZeaTreasury.sol
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Treasury contract managed by governance for DAO funds
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ZeaTreasury
 * @dev Simple treasury contract controlled by governance
 */
contract ZeaTreasury is Ownable {
    event FundsDeposited(address indexed token, uint256 amount);
    event FundsWithdrawn(address indexed token, address indexed to, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Withdraw tokens from treasury (only governance/owner)
     */
    function withdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(IERC20(token).transfer(to, amount), "ZeaTreasury: transfer failed");
        emit FundsWithdrawn(token, to, amount);
    }

    /**
     * @dev Withdraw ETH from treasury (only governance/owner)
     */
    function withdrawETH(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "ZeaTreasury: insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "ZeaTreasury: ETH transfer failed");
    }

    /**
     * @dev Allow contract to receive ETH/native tokens
     */
    receive() external payable {
        emit FundsDeposited(address(0), msg.value);
    }
}
