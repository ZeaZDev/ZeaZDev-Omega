// ZeaZDev [Smart Contract - ZEA Token] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZeaToken
 * @dev Production-grade ERC20 token for ZeaZDev ecosystem
 * $ZEA - Primary utility token for Governance, Staking, and Trading
 */
contract ZeaToken is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 Billion tokens
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18; // 10 Billion max

    mapping(address => bool) public minters;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "ZeaToken: caller is not a minter");
        _;
    }

    constructor(address initialOwner) 
        ERC20("ZeaToken", "ZEA") 
        ERC20Permit("ZeaToken")
        Ownable(initialOwner)
    {
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    /**
     * @dev Mint new tokens (restricted to minters)
     * @param to Address to receive tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "ZeaToken: max supply exceeded");
        _mint(to, amount);
    }

    /**
     * @dev Add a new minter
     * @param minter Address to add as minter
     */
    function addMinter(address minter) external onlyOwner {
        require(!minters[minter], "ZeaToken: already a minter");
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @dev Remove a minter
     * @param minter Address to remove from minters
     */
    function removeMinter(address minter) external onlyOwner {
        require(minters[minter], "ZeaToken: not a minter");
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
}
