import { Controller, Get, Post, Param, Body, Patch, Query } from '@nestjs/common';
import { InvestmentsService } from '../services/investments.service';

@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get()
  getAllInvestments(@Query('userId') userId?: string): any {
    return this.investmentsService.getInvestments(userId);
  }

  @Get('portfolio')
  getPortfolio(): any {
    return this.investmentsService.getPortfolio();
  }

  @Get(':id')
  getInvestment(@Param('id') id: string): any {
    return this.investmentsService.getInvestmentById(id);
  }

  @Post()
  createInvestment(@Body() body: { userId: string; type: string; value: number; currency?: string; riskLevel?: 'low' | 'medium' | 'high' }): any {
    return this.investmentsService.createInvestment(body.userId, body.type, body.value, body.currency, body.riskLevel);
  }

  @Post(':id/buy')
  buy(@Param('id') id: string, @Body() body: { amount: number; description?: string }): any {
    return this.investmentsService.buy(id, body.amount, body.description);
  }

  @Post(':id/sell')
  sell(@Param('id') id: string, @Body() body: { amount: number; description?: string }): any {
    return this.investmentsService.sell(id, body.amount, body.description);
  }

  @Patch(':id/close')
  closeInvestment(@Param('id') id: string): any {
    return this.investmentsService.closeInvestment(id);
  }

  @Get(':id/transactions')
  getInvestmentTransactions(@Param('id') id: string): any {
    return this.investmentsService.getInvestmentTransactions(id);
  }

  @Get('transactions/all')
  getAllInvestmentTransactions(): any {
    return this.investmentsService.getAllInvestmentTransactions();
  }

  // ... (add endpoints for analytics, risk, portfolio optimization, notifications, etc.)
}
