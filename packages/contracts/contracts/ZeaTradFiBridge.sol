// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ZeaTradFiBridge
 * @notice Traditional Finance Bridge for fiat-to-crypto conversions
 * @dev Handles bank deposits, withdrawals, card funding, and KYC verification
 */
contract ZeaTradFiBridge is Ownable, ReentrancyGuard, Pausable {
    
    // Transaction types
    enum TransactionType {
        BankDeposit,      // Fiat deposit from bank account
        BankWithdrawal,   // Fiat withdrawal to bank account
        CardFunding,      // Fund crypto debit card
        CardRefund,       // Refund from crypto debit card
        PromptPayDeposit  // PromptPay QR payment (Thailand)
    }
    
    // Transaction status
    enum TransactionStatus {
        Pending,
        Processing,
        Completed,
        Failed,
        Cancelled,
        Refunded
    }
    
    // KYC verification levels
    enum KYCLevel {
        None,        // Not verified (0 limit)
        Basic,       // Email + phone verified (10K THB/month)
        Standard,    // ID document verified (100K THB/month)
        Premium,     // Full verification + address proof (1M THB/month)
        Enterprise   // Business account (unlimited)
    }
    
    // Transaction structure
    struct Transaction {
        bytes32 txId;
        address user;
        TransactionType txType;
        TransactionStatus status;
        address token;
        uint256 tokenAmount;
        uint256 fiatAmount;      // Amount in fiat (cents/satang)
        string fiatCurrency;     // THB, USD, EUR, etc.
        string bankReference;    // Bank transaction reference
        uint256 timestamp;
        uint256 completedAt;
        uint256 fee;             // Platform fee
        string failureReason;
    }
    
    // User KYC data
    struct UserKYC {
        KYCLevel level;
        bool verified;
        uint256 verifiedAt;
        uint256 monthlyLimit;    // In fiat currency (cents/satang)
        uint256 monthlyUsed;     // Current month usage
        uint256 lastResetMonth;  // Last time monthly limit was reset
        string kycProvider;      // e.g., "WorldID", "Onfido", "Jumio"
        bytes32 kycHash;         // Hash of KYC documents
    }
    
    // Card structure
    struct Card {
        bytes32 cardId;
        address user;
        string cardType;         // "virtual" or "physical"
        string cardNumber;       // Encrypted card number (last 4 digits)
        uint256 balance;         // Available balance
        uint256 spendingLimit;   // Daily spending limit
        uint256 spentToday;      // Amount spent today
        uint256 lastSpendDate;   // Last spending date
        bool active;
        uint256 issuedAt;
        uint256 expiresAt;
    }
    
    // Bank account structure
    struct BankAccount {
        bytes32 accountId;
        address user;
        string bankCode;         // e.g., "SCB", "KBANK", "BBL"
        string accountNumber;    // Encrypted account number
        string accountName;
        bool verified;
        uint256 verifiedAt;
    }
    
    // State variables
    mapping(bytes32 => Transaction) public transactions;
    mapping(address => UserKYC) public userKYC;
    mapping(bytes32 => Card) public cards;
    mapping(bytes32 => BankAccount) public bankAccounts;
    mapping(address => bytes32[]) public userTransactions;
    mapping(address => bytes32[]) public userCards;
    mapping(address => bytes32[]) public userBankAccounts;
    mapping(address => bool) public authorizedOperators;
    
    // Exchange rates (scaled by 1e6 for precision)
    mapping(string => uint256) public exchangeRates; // currency => rate in USD
    
    // Fee configuration (basis points, 100 = 1%)
    uint256 public depositFee = 50;      // 0.5%
    uint256 public withdrawalFee = 100;  // 1.0%
    uint256 public cardFundingFee = 30;  // 0.3%
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    
    // Supported fiat currencies
    mapping(string => bool) public supportedCurrencies;
    
    // Monthly limits per KYC level (in USD cents)
    mapping(KYCLevel => uint256) public kycLimits;
    
    // Events
    event TransactionCreated(bytes32 indexed txId, address indexed user, TransactionType txType, uint256 fiatAmount, uint256 tokenAmount);
    event TransactionUpdated(bytes32 indexed txId, TransactionStatus status, string reason);
    event TransactionCompleted(bytes32 indexed txId, address indexed user, uint256 tokenAmount);
    event KYCUpdated(address indexed user, KYCLevel level, bool verified);
    event CardIssued(bytes32 indexed cardId, address indexed user, string cardType);
    event CardFunded(bytes32 indexed cardId, uint256 amount);
    event BankAccountAdded(bytes32 indexed accountId, address indexed user, string bankCode);
    event ExchangeRateUpdated(string currency, uint256 rate);
    event OperatorAuthorized(address operator, bool authorized);
    
    constructor() {
        // Initialize supported currencies
        supportedCurrencies["THB"] = true;
        supportedCurrencies["USD"] = true;
        supportedCurrencies["EUR"] = true;
        supportedCurrencies["SGD"] = true;
        
        // Initialize KYC limits (in USD cents)
        kycLimits[KYCLevel.None] = 0;
        kycLimits[KYCLevel.Basic] = 300_00;        // $300
        kycLimits[KYCLevel.Standard] = 3000_00;    // $3,000
        kycLimits[KYCLevel.Premium] = 30000_00;    // $30,000
        kycLimits[KYCLevel.Enterprise] = type(uint256).max;
        
        // Initialize default exchange rates (scaled by 1e6)
        exchangeRates["THB"] = 35_000000;  // 35 THB = 1 USD
        exchangeRates["USD"] = 1_000000;   // 1 USD = 1 USD
        exchangeRates["EUR"] = 900000;     // 0.9 EUR = 1 USD
        exchangeRates["SGD"] = 1_350000;   // 1.35 SGD = 1 USD
    }
    
    // Modifiers
    modifier onlyOperator() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "Not authorized operator");
        _;
    }
    
    modifier validKYC() {
        require(userKYC[msg.sender].verified, "KYC verification required");
        _;
    }
    
    // Operator management
    function authorizeOperator(address operator, bool authorized) external onlyOwner {
        authorizedOperators[operator] = authorized;
        emit OperatorAuthorized(operator, authorized);
    }
    
    // KYC functions
    function updateUserKYC(
        address user,
        KYCLevel level,
        bool verified,
        string calldata kycProvider,
        bytes32 kycHash
    ) external onlyOperator {
        UserKYC storage kyc = userKYC[user];
        kyc.level = level;
        kyc.verified = verified;
        kyc.verifiedAt = block.timestamp;
        kyc.monthlyLimit = kycLimits[level];
        kyc.kycProvider = kycProvider;
        kyc.kycHash = kycHash;
        
        // Reset monthly usage if new month
        uint256 currentMonth = block.timestamp / 30 days;
        if (kyc.lastResetMonth != currentMonth) {
            kyc.monthlyUsed = 0;
            kyc.lastResetMonth = currentMonth;
        }
        
        emit KYCUpdated(user, level, verified);
    }
    
    function getUserKYC(address user) external view returns (UserKYC memory) {
        return userKYC[user];
    }
    
    // Bank account management
    function addBankAccount(
        address user,
        string calldata bankCode,
        string calldata accountNumber,
        string calldata accountName
    ) external onlyOperator returns (bytes32) {
        bytes32 accountId = keccak256(abi.encodePacked(user, bankCode, accountNumber, block.timestamp));
        
        bankAccounts[accountId] = BankAccount({
            accountId: accountId,
            user: user,
            bankCode: bankCode,
            accountNumber: accountNumber,
            accountName: accountName,
            verified: false,
            verifiedAt: 0
        });
        
        userBankAccounts[user].push(accountId);
        emit BankAccountAdded(accountId, user, bankCode);
        
        return accountId;
    }
    
    function verifyBankAccount(bytes32 accountId) external onlyOperator {
        require(bankAccounts[accountId].user != address(0), "Account does not exist");
        bankAccounts[accountId].verified = true;
        bankAccounts[accountId].verifiedAt = block.timestamp;
    }
    
    function getUserBankAccounts(address user) external view returns (bytes32[] memory) {
        return userBankAccounts[user];
    }
    
    // Card management
    function issueCard(
        address user,
        string calldata cardType,
        string calldata cardNumberLast4,
        uint256 spendingLimit,
        uint256 expiryDuration
    ) external onlyOperator validKYC returns (bytes32) {
        bytes32 cardId = keccak256(abi.encodePacked(user, cardType, block.timestamp));
        
        cards[cardId] = Card({
            cardId: cardId,
            user: user,
            cardType: cardType,
            cardNumber: cardNumberLast4,
            balance: 0,
            spendingLimit: spendingLimit,
            spentToday: 0,
            lastSpendDate: 0,
            active: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + expiryDuration
        });
        
        userCards[user].push(cardId);
        emit CardIssued(cardId, user, cardType);
        
        return cardId;
    }
    
    function fundCard(bytes32 cardId, uint256 amount) external nonReentrant whenNotPaused {
        Card storage card = cards[cardId];
        require(card.user == msg.sender, "Not card owner");
        require(card.active, "Card is inactive");
        require(block.timestamp < card.expiresAt, "Card expired");
        
        card.balance += amount;
        emit CardFunded(cardId, amount);
    }
    
    function getUserCards(address user) external view returns (bytes32[] memory) {
        return userCards[user];
    }
    
    // Fiat deposit (bank transfer to crypto)
    function createDepositTransaction(
        address token,
        uint256 fiatAmount,
        string calldata fiatCurrency,
        string calldata bankReference
    ) external validKYC nonReentrant whenNotPaused returns (bytes32) {
        require(supportedTokens[token], "Token not supported");
        require(supportedCurrencies[fiatCurrency], "Currency not supported");
        require(fiatAmount > 0, "Invalid amount");
        
        // Check KYC limits
        _checkKYCLimit(msg.sender, fiatAmount, fiatCurrency);
        
        // Calculate token amount based on exchange rate
        uint256 tokenAmount = _calculateTokenAmount(fiatAmount, fiatCurrency, token);
        uint256 fee = (tokenAmount * depositFee) / 10000;
        uint256 netAmount = tokenAmount - fee;
        
        bytes32 txId = keccak256(abi.encodePacked(msg.sender, token, fiatAmount, block.timestamp));
        
        transactions[txId] = Transaction({
            txId: txId,
            user: msg.sender,
            txType: TransactionType.BankDeposit,
            status: TransactionStatus.Pending,
            token: token,
            tokenAmount: netAmount,
            fiatAmount: fiatAmount,
            fiatCurrency: fiatCurrency,
            bankReference: bankReference,
            timestamp: block.timestamp,
            completedAt: 0,
            fee: fee,
            failureReason: ""
        });
        
        userTransactions[msg.sender].push(txId);
        emit TransactionCreated(txId, msg.sender, TransactionType.BankDeposit, fiatAmount, netAmount);
        
        return txId;
    }
    
    // Fiat withdrawal (crypto to bank transfer)
    function createWithdrawalTransaction(
        address token,
        uint256 tokenAmount,
        string calldata fiatCurrency,
        bytes32 bankAccountId
    ) external validKYC nonReentrant whenNotPaused returns (bytes32) {
        require(supportedTokens[token], "Token not supported");
        require(supportedCurrencies[fiatCurrency], "Currency not supported");
        require(tokenAmount > 0, "Invalid amount");
        require(bankAccounts[bankAccountId].verified, "Bank account not verified");
        require(bankAccounts[bankAccountId].user == msg.sender, "Not your bank account");
        
        // Calculate fiat amount
        uint256 fiatAmount = _calculateFiatAmount(tokenAmount, fiatCurrency, token);
        
        // Check KYC limits
        _checkKYCLimit(msg.sender, fiatAmount, fiatCurrency);
        
        // Calculate fees
        uint256 fee = (tokenAmount * withdrawalFee) / 10000;
        uint256 netTokenAmount = tokenAmount - fee;
        
        // Transfer tokens to contract
        require(IERC20(token).transferFrom(msg.sender, address(this), tokenAmount), "Transfer failed");
        
        bytes32 txId = keccak256(abi.encodePacked(msg.sender, token, tokenAmount, block.timestamp));
        
        transactions[txId] = Transaction({
            txId: txId,
            user: msg.sender,
            txType: TransactionType.BankWithdrawal,
            status: TransactionStatus.Pending,
            token: token,
            tokenAmount: netTokenAmount,
            fiatAmount: fiatAmount,
            fiatCurrency: fiatCurrency,
            bankReference: string(abi.encodePacked(bankAccountId)),
            timestamp: block.timestamp,
            completedAt: 0,
            fee: fee,
            failureReason: ""
        });
        
        userTransactions[msg.sender].push(txId);
        emit TransactionCreated(txId, msg.sender, TransactionType.BankWithdrawal, fiatAmount, netTokenAmount);
        
        return txId;
    }
    
    // Complete deposit (operator confirms bank payment received)
    function completeDeposit(bytes32 txId) external onlyOperator {
        Transaction storage tx = transactions[txId];
        require(tx.status == TransactionStatus.Pending, "Invalid transaction status");
        require(tx.txType == TransactionType.BankDeposit || tx.txType == TransactionType.PromptPayDeposit, "Not a deposit");
        
        // Mint or transfer tokens to user
        require(IERC20(tx.token).transfer(tx.user, tx.tokenAmount), "Transfer failed");
        
        tx.status = TransactionStatus.Completed;
        tx.completedAt = block.timestamp;
        
        // Update monthly usage
        _updateMonthlyUsage(tx.user, tx.fiatAmount);
        
        emit TransactionCompleted(txId, tx.user, tx.tokenAmount);
        emit TransactionUpdated(txId, TransactionStatus.Completed, "");
    }
    
    // Complete withdrawal (operator confirms fiat sent to bank)
    function completeWithdrawal(bytes32 txId, string calldata bankTransferRef) external onlyOperator {
        Transaction storage tx = transactions[txId];
        require(tx.status == TransactionStatus.Pending, "Invalid transaction status");
        require(tx.txType == TransactionType.BankWithdrawal, "Not a withdrawal");
        
        tx.status = TransactionStatus.Completed;
        tx.completedAt = block.timestamp;
        tx.bankReference = bankTransferRef;
        
        // Update monthly usage
        _updateMonthlyUsage(tx.user, tx.fiatAmount);
        
        emit TransactionCompleted(txId, tx.user, tx.tokenAmount);
        emit TransactionUpdated(txId, TransactionStatus.Completed, bankTransferRef);
    }
    
    // Fail transaction
    function failTransaction(bytes32 txId, string calldata reason) external onlyOperator {
        Transaction storage tx = transactions[txId];
        require(tx.status == TransactionStatus.Pending, "Invalid transaction status");
        
        // Refund tokens if withdrawal
        if (tx.txType == TransactionType.BankWithdrawal) {
            require(IERC20(tx.token).transfer(tx.user, tx.tokenAmount + tx.fee), "Refund failed");
        }
        
        tx.status = TransactionStatus.Failed;
        tx.failureReason = reason;
        
        emit TransactionUpdated(txId, TransactionStatus.Failed, reason);
    }
    
    // Get user transactions
    function getUserTransactions(address user) external view returns (bytes32[] memory) {
        return userTransactions[user];
    }
    
    function getTransaction(bytes32 txId) external view returns (Transaction memory) {
        return transactions[txId];
    }
    
    // Exchange rate management
    function updateExchangeRate(string calldata currency, uint256 rate) external onlyOperator {
        exchangeRates[currency] = rate;
        emit ExchangeRateUpdated(currency, rate);
    }
    
    // Token management
    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }
    
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }
    
    // Fee management
    function updateFees(uint256 _depositFee, uint256 _withdrawalFee, uint256 _cardFundingFee) external onlyOwner {
        require(_depositFee <= 1000, "Fee too high"); // Max 10%
        require(_withdrawalFee <= 1000, "Fee too high");
        require(_cardFundingFee <= 1000, "Fee too high");
        
        depositFee = _depositFee;
        withdrawalFee = _withdrawalFee;
        cardFundingFee = _cardFundingFee;
    }
    
    // Internal helper functions
    function _calculateTokenAmount(
        uint256 fiatAmount,
        string calldata fiatCurrency,
        address token
    ) internal view returns (uint256) {
        // Convert fiat to USD, then to token
        // This is a simplified version - production would use oracle prices
        uint256 usdAmount = (fiatAmount * 1e6) / exchangeRates[fiatCurrency];
        // Assuming 1 token = 1 USD for simplicity
        return usdAmount * 1e18 / 1e6; // Convert to token decimals
    }
    
    function _calculateFiatAmount(
        uint256 tokenAmount,
        string calldata fiatCurrency,
        address token
    ) internal view returns (uint256) {
        // Convert token to USD, then to fiat
        uint256 usdAmount = tokenAmount * 1e6 / 1e18; // Convert from token decimals
        return (usdAmount * exchangeRates[fiatCurrency]) / 1e6;
    }
    
    function _checkKYCLimit(address user, uint256 fiatAmount, string calldata currency) internal view {
        UserKYC storage kyc = userKYC[user];
        
        // Convert to USD for limit checking
        uint256 usdAmount = (fiatAmount * 1e6) / exchangeRates[currency];
        
        uint256 currentMonth = block.timestamp / 30 days;
        uint256 monthlyUsed = kyc.lastResetMonth == currentMonth ? kyc.monthlyUsed : 0;
        
        require(monthlyUsed + usdAmount <= kyc.monthlyLimit, "Monthly limit exceeded");
    }
    
    function _updateMonthlyUsage(address user, uint256 fiatAmount) internal {
        UserKYC storage kyc = userKYC[user];
        
        uint256 currentMonth = block.timestamp / 30 days;
        if (kyc.lastResetMonth != currentMonth) {
            kyc.monthlyUsed = 0;
            kyc.lastResetMonth = currentMonth;
        }
        
        kyc.monthlyUsed += fiatAmount;
    }
    
    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Withdraw accumulated fees
    function withdrawFees(address token, address to) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(IERC20(token).transfer(to, balance), "Transfer failed");
    }
}
