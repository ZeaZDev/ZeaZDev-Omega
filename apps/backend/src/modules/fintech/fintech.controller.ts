// ZeaZDev [Backend Controller - FinTech] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { BankThaiService } from './bank.thai.service';
import { CardService } from './card.service';

@Controller('fintech')
export class FintechController {
  constructor(
    private readonly bankThaiService: BankThaiService,
    private readonly cardService: CardService,
  ) {}

  @Post('card/issue')
  async issueCard(
    @Body() body: {
      userId: string;
      fullName: string;
      email: string;
      phone: string;
    },
  ) {
    return this.cardService.issueCard(
      body.userId,
      body.fullName,
      body.email,
      body.phone,
    );
  }

  @Get('card/user/:userId')
  async getUserCard(@Param('userId') userId: string) {
    return this.cardService.getUserCard(userId);
  }

  @Post('bank/thai/deposit')
  async depositFromBank(
    @Body() body: {
      userId: string;
      amount: string;
      bankAccountNumber: string;
    },
  ) {
    return this.bankThaiService.deposit(
      body.userId,
      body.amount,
      body.bankAccountNumber,
    );
  }

  @Post('bank/thai/withdraw')
  async withdrawToBank(
    @Body() body: {
      userId: string;
      amount: string;
      bankAccountNumber: string;
    },
  ) {
    return this.bankThaiService.withdraw(
      body.userId,
      body.amount,
      body.bankAccountNumber,
    );
  }

  @Get('transactions/user/:userId')
  async getUserTransactions(@Param('userId') userId: string) {
    return this.bankThaiService.getUserTransactions(userId);
  }
}
