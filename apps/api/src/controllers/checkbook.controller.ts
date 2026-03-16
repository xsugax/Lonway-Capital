import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { CheckbookService } from '../services/checkbook.service';

@Controller('checkbook')
export class CheckbookController {
  constructor(private readonly checkbookService: CheckbookService) {}

  @Post('request')
  requestCheckbook(@Body() body: any): any {
    return this.checkbookService.requestCheckbook(body);
  }

  @Patch(':id/approve')
  approveCheckbook(@Param('id') id: string, @Body() body: { startNumber?: number }): any {
    return this.checkbookService.approveCheckbook(id, body?.startNumber);
  }

  @Patch(':id/reject')
  rejectCheckbook(@Param('id') id: string, @Body() body: { reason?: string }): any {
    return this.checkbookService.rejectCheckbook(id, body?.reason);
  }

  @Patch(':id/check/:checkNumber')
  updateCheck(@Param('id') id: string, @Param('checkNumber') checkNumber: string, @Body() body: any): any {
    return this.checkbookService.updateCheck(id, checkNumber, body);
  }

  @Get('user/:userId')
  getUserCheckbooks(@Param('userId') userId: string): any {
    return this.checkbookService.getUserCheckbooks(userId);
  }

  @Get('pending')
  getPendingCheckbooks(): any {
    return this.checkbookService.getPendingCheckbooks();
  }

  @Get()
  getAllCheckbooks(): any {
    return this.checkbookService.getAllCheckbooks();
  }

  @Get(':id')
  getCheckbook(@Param('id') id: string): any {
    return this.checkbookService.getCheckbookById(id);
  }
}
