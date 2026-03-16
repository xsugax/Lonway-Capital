import { Controller, Get, Post, Param, Body, Patch, Query, BadRequestException } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  getAllAccounts(@Query('userId') userId?: string): any {
    return this.accountsService.getAccounts(userId);
  }

  @Get(':id')
  getAccount(@Param('id') id: string): any {
    return this.accountsService.getAccountById(id);
  }

  @Post()
  createAccount(@Body() body: { userId: string; type: string; currency?: string }): any {
    return this.accountsService.createAccount(body.userId, body.type, body.currency);
  }

  @Post(':id/deposit')
  deposit(@Param('id') id: string, @Body() body: { amount: number; description?: string }): any {
    return this.accountsService.deposit(id, body.amount, body.description);
  }

  @Post(':id/withdraw')
  withdraw(@Param('id') id: string, @Body() body: { amount: number; description?: string }): any {
    return this.accountsService.withdraw(id, body.amount, body.description);
  }

  @Post('transfer')
  transfer(@Body() body: { fromAccountId: string; toAccountId: string; amount: number; description?: string }): any {
    return this.accountsService.transfer(body.fromAccountId, body.toAccountId, body.amount, body.description);
  }

  @Patch(':id/freeze')
  freezeAccount(@Param('id') id: string): any {
    return this.accountsService.freezeAccount(id);
  }

  @Patch(':id/close')
  closeAccount(@Param('id') id: string): any {
    return this.accountsService.closeAccount(id);
  }

  @Get(':id/transactions')
  getTransactionHistory(@Param('id') id: string): any {
    return this.accountsService.getTransactionHistory(id);
  }

  @Get('transactions/all')
  getAllTransactions(): any {
    return this.accountsService.getAllTransactions();
  }

  // ... (add endpoints for analytics, fraud detection, scheduled transfers, notifications, etc.)
}
