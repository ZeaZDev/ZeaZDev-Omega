/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Smart-Contracts-DING
 * @File: DingToken.sol
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Production-grade ERC20 reward token for GameFi ecosystem with pausable and burnable features
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DingToken
 * @dev Production-grade ERC20 reward token for ZeaZDev GameFi ecosystem
 * $DING - In-game reward token for Slots/Rewards, pausable and burnable
 */
contract DingToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000_000 * 10**18; // 100 Billion max

    mapping(address => bool) public gameContracts;

    event GameContractAdded(address indexed gameContract);
    event GameContractRemoved(address indexed gameContract);
    event TokensBurned(address indexed from, uint256 amount);

    modifier onlyGameContract() {
        require(
            gameContracts[msg.sender] || msg.sender == owner(),
            "DingToken: caller is not a game contract"
        );
        _;
    }

    constructor(address initialOwner)
        ERC20("DingToken", "DING")
        Ownable(initialOwner)
    {}

    /**
     * @dev Mint rewards to player (restricted to game contracts)
     * @param to Player address
     * @param amount Reward amount
     */
    function mintReward(address to, uint256 amount) external onlyGameContract whenNotPaused {
        require(totalSupply() + amount <= MAX_SUPPLY, "DingToken: max supply exceeded");
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from player for in-game purchases
     * @param from Player address
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) public override whenNotPaused {
        super.burnFrom(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @dev Add a game contract that can mint rewards
     * @param gameContract Address of game contract
     */
    function addGameContract(address gameContract) external onlyOwner {
        require(!gameContracts[gameContract], "DingToken: already a game contract");
        gameContracts[gameContract] = true;
        emit GameContractAdded(gameContract);
    }

    /**
     * @dev Remove a game contract
     * @param gameContract Address to remove
     */
    function removeGameContract(address gameContract) external onlyOwner {
        require(gameContracts[gameContract], "DingToken: not a game contract");
        gameContracts[gameContract] = false;
        emit GameContractRemoved(gameContract);
    }

    /**
     * @dev Pause token transfers (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Required override for ERC20Pausable
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
