import { Controller, Get, Post, Param, Body, Patch, Query } from '@nestjs/common';
import { VaultsService } from '../services/vaults.service';

@Controller('vaults')
export class VaultsController {
  constructor(private readonly vaultsService: VaultsService) {}

  @Get()
  getAllVaults(@Query('userId') userId?: string): any {
    return this.vaultsService.getVaults(userId);
  }

  @Get(':id')
  getVault(@Param('id') id: string): any {
    return this.vaultsService.getVaultById(id);
  }

  @Post()
  createVault(@Body() body: { userId: string; name: string; target: number; currency?: string; goalDate?: string }): any {
    return this.vaultsService.createVault(body.userId, body.name, body.target, body.currency, body.goalDate ? new Date(body.goalDate) : undefined);
  }

  @Post(':id/fund')
  fundVault(@Param('id') id: string, @Body() body: { amount: number; description?: string }): any {
    return this.vaultsService.fundVault(id, body.amount, body.description);
  }

  @Post(':id/withdraw')
  withdrawFromVault(@Param('id') id: string, @Body() body: { amount: number; description?: string }): any {
    return this.vaultsService.withdrawFromVault(id, body.amount, body.description);
  }

  @Patch(':id/close')
  closeVault(@Param('id') id: string): any {
    return this.vaultsService.closeVault(id);
  }

  @Patch(':id/archive')
  archiveVault(@Param('id') id: string): any {
    return this.vaultsService.archiveVault(id);
  }

  @Get(':id/transactions')
  getVaultTransactions(@Param('id') id: string): any {
    return this.vaultsService.getVaultTransactions(id);
  }

  @Get('transactions/all')
  getAllVaultTransactions(): any {
    return this.vaultsService.getAllVaultTransactions();
  }

  // ... (add endpoints for analytics, auto-funding, goal tracking, notifications, etc.)
}
