import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TradFiService } from './tradfi.service';

/**
 * TradFi Bridge Controller
 * Endpoints for traditional finance integration
 */

@Controller('tradfi')
export class TradFiController {
  constructor(private readonly tradfiService: TradFiService) {}
  
  // ============================================================================
  // General Information Endpoints
  // ============================================================================
  
  /**
   * Get supported banks
   * GET /tradfi/banks
   */
  @Get('banks')
  async getSupportedBanks() {
    return this.tradfiService.getSupportedBanks();
  }
  
  /**
   * Get supported fiat currencies
   * GET /tradfi/currencies
   */
  @Get('currencies')
  async getSupportedCurrencies() {
    return this.tradfiService.getSupportedCurrencies();
  }
  
  /**
   * Get current exchange rates
   * GET /tradfi/exchange-rates
   */
  @Get('exchange-rates')
  async getExchangeRates() {
    return this.tradfiService.getExchangeRates();
  }
  
  /**
   * Get KYC levels and limits
   * GET /tradfi/kyc/levels
   */
  @Get('kyc/levels')
  async getKYCLevels() {
    return this.tradfiService.getKYCLevels();
  }
  
  /**
   * Get TradFi statistics
   * GET /tradfi/stats
   */
  @Get('stats')
  async getTradFiStats(@Query('userId') userId?: string) {
    return this.tradfiService.getTradFiStats(userId);
  }
  
  // ============================================================================
  // KYC/AML Endpoints
  // ============================================================================
  
  /**
   * Submit KYC verification
   * POST /tradfi/kyc/submit
   */
  @Post('kyc/submit')
  async submitKYC(@Body() data: {
    userId: string;
    level: string;
    documentType: string;
    documentNumber: string;
    documentImages: string[];
    selfieImage: string;
    addressProof?: string;
  }) {
    return this.tradfiService.submitKYCVerification(data);
  }
  
  /**
   * Get user KYC status
   * GET /tradfi/kyc/:userId
   */
  @Get('kyc/:userId')
  async getUserKYC(@Param('userId') userId: string) {
    return this.tradfiService.getUserKYC(userId);
  }
  
  // ============================================================================
  // Bank Account Endpoints
  // ============================================================================
  
  /**
   * Add bank account
   * POST /tradfi/bank-accounts
   */
  @Post('bank-accounts')
  async addBankAccount(@Body() data: {
    userId: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    accountType: 'savings' | 'checking' | 'business';
  }) {
    return this.tradfiService.addBankAccount(data);
  }
  
  /**
   * Verify bank account
   * POST /tradfi/bank-accounts/verify
   */
  @Post('bank-accounts/verify')
  async verifyBankAccount(@Body() data: {
    accountId: string;
    verificationAmount: number;
  }) {
    return this.tradfiService.verifyBankAccount(data);
  }
  
  /**
   * Get user bank accounts
   * GET /tradfi/bank-accounts/:userId
   */
  @Get('bank-accounts/:userId')
  async getUserBankAccounts(@Param('userId') userId: string) {
    return this.tradfiService.getUserBankAccounts(userId);
  }
  
  // ============================================================================
  // Deposit Endpoints
  // ============================================================================
  
  /**
   * Get deposit quote
   * POST /tradfi/deposits/quote
   */
  @Post('deposits/quote')
  async getDepositQuote(@Body() data: {
    fiatCurrency: string;
    fiatAmount: number;
    tokenSymbol: string;
  }) {
    return this.tradfiService.getDepositQuote(data);
  }
  
  /**
   * Create deposit transaction
   * POST /tradfi/deposits
   */
  @Post('deposits')
  async createDeposit(@Body() data: {
    userId: string;
    fiatCurrency: string;
    fiatAmount: number;
    tokenSymbol: string;
    paymentMethod: 'bank_transfer' | 'promptpay' | 'card';
  }) {
    return this.tradfiService.createDepositTransaction(data);
  }
  
  // ============================================================================
  // Withdrawal Endpoints
  // ============================================================================
  
  /**
   * Get withdrawal quote
   * POST /tradfi/withdrawals/quote
   */
  @Post('withdrawals/quote')
  async getWithdrawalQuote(@Body() data: {
    tokenSymbol: string;
    tokenAmount: number;
    fiatCurrency: string;
  }) {
    return this.tradfiService.getWithdrawalQuote(data);
  }
  
  /**
   * Create withdrawal transaction
   * POST /tradfi/withdrawals
   */
  @Post('withdrawals')
  async createWithdrawal(@Body() data: {
    userId: string;
    tokenSymbol: string;
    tokenAmount: number;
    fiatCurrency: string;
    bankAccountId: string;
  }) {
    return this.tradfiService.createWithdrawalTransaction(data);
  }
  
  // ============================================================================
  // Transaction Endpoints
  // ============================================================================
  
  /**
   * Get user transactions
   * GET /tradfi/transactions/:userId
   */
  @Get('transactions/:userId')
  async getUserTransactions(
    @Param('userId') userId: string,
    @Query('type') type?: 'deposit' | 'withdrawal',
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tradfiService.getUserTransactions(userId, {
      type,
      status,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
  
  /**
   * Get transaction details
   * GET /tradfi/transactions/details/:txId
   */
  @Get('transactions/details/:txId')
  async getTransaction(@Param('txId') txId: string) {
    return this.tradfiService.getTransaction(txId);
  }
  
  // ============================================================================
  // Card Endpoints
  // ============================================================================
  
  /**
   * Issue virtual card
   * POST /tradfi/cards/virtual
   */
  @Post('cards/virtual')
  async issueVirtualCard(@Body() data: {
    userId: string;
    cardNetwork: 'visa' | 'mastercard';
    spendingLimit: string;
  }) {
    return this.tradfiService.issueVirtualCard(data);
  }
  
  /**
   * Issue physical card
   * POST /tradfi/cards/physical
   */
  @Post('cards/physical')
  async issuePhysicalCard(@Body() data: {
    userId: string;
    cardNetwork: 'visa' | 'mastercard';
    spendingLimit: string;
    shippingAddress: any;
  }) {
    return this.tradfiService.issuePhysicalCard(data);
  }
  
  /**
   * Get user cards
   * GET /tradfi/cards/:userId
   */
  @Get('cards/:userId')
  async getUserCards(@Param('userId') userId: string) {
    return this.tradfiService.getUserCards(userId);
  }
  
  /**
   * Fund card
   * POST /tradfi/cards/fund
   */
  @Post('cards/fund')
  async fundCard(@Body() data: {
    cardId: string;
    tokenSymbol: string;
    tokenAmount: number;
  }) {
    return this.tradfiService.fundCard(data);
  }
  
  /**
   * Get card transactions
   * GET /tradfi/cards/:cardId/transactions
   */
  @Get('cards/:cardId/transactions')
  async getCardTransactions(
    @Param('cardId') cardId: string,
    @Query('limit') limit?: string,
  ) {
    return this.tradfiService.getCardTransactions(
      cardId,
      limit ? parseInt(limit) : 20,
    );
  }
}
