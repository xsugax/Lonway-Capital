import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { TransferService } from '../services/transfer.service';

@Controller('transfer')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  initiateTransfer(@Body() body: any): any {
    return this.transferService.initiateTransfer(body);
  }

  @Patch(':id/approve')
  approveTransfer(@Param('id') id: string): any {
    return this.transferService.approveTransfer(id);
  }

  @Patch(':id/reject')
  rejectTransfer(@Param('id') id: string, @Body() body: { reason?: string }): any {
    return this.transferService.rejectTransfer(id, body?.reason);
  }

  @Patch(':id/complete')
  completeTransfer(@Param('id') id: string): any {
    return this.transferService.completeTransfer(id);
  }

  @Patch(':id/fail')
  failTransfer(@Param('id') id: string, @Body() body: { reason: string }): any {
    return this.transferService.failTransfer(id, body.reason);
  }

  @Patch(':id/reverse')
  reverseTransfer(@Param('id') id: string, @Body() body: { reason: string }): any {
    return this.transferService.reverseTransfer(id, body.reason);
  }

  @Get('pending')
  getPendingTransfers(): any {
    return this.transferService.getPendingTransfers();
  }

  @Get('account/:accountId')
  getTransfersForAccount(@Param('accountId') accountId: string): any {
    return this.transferService.getTransfersForAccount(accountId);
  }

  @Get()
  getAllTransfers(): any {
    return this.transferService.getAllTransfers();
  }

  @Get(':id')
  getTransfer(@Param('id') id: string): any {
    return this.transferService.getTransferById(id);
  }
}
