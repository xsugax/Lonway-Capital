import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AdminService } from '../services/admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Users ──────────────────────────────────────────────
  @Get('users')
  getUsers(): any {
    return this.adminService.getUsers();
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string): any {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  createUser(@Body() body: { name: string; email: string; password: string; role?: any; kyc?: boolean; balance?: number }): any {
    return this.adminService.createUser(body.name, body.email, body.password, body.role, body.kyc, body.balance);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string): any {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/freeze')
  freezeUser(@Param('id') id: string): any {
    return this.adminService.freezeUser(id);
  }

  @Patch('users/:id/unfreeze')
  unfreezeUser(@Param('id') id: string): any {
    return this.adminService.unfreezeUser(id);
  }

  @Patch('users/:id/fund')
  fundUser(@Param('id') id: string, @Body() body: { amount: number }): any {
    return this.adminService.fundUser(id, body.amount);
  }

  @Patch('users/:id/debit')
  debitUser(@Param('id') id: string, @Body() body: { amount: number }): any {
    return this.adminService.debitUser(id, body.amount);
  }

  @Patch('users/:id/kyc')
  setKyc(@Param('id') id: string, @Body() body: { kyc: boolean }): any {
    return this.adminService.setKycStatus(id, body.kyc);
  }

  @Patch('users/:id/role')
  changeRole(@Param('id') id: string, @Body() body: { role: any }): any {
    return this.adminService.changeUserRole(id, body.role);
  }

  @Patch('users/:id/reset-password')
  resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }): any {
    return this.adminService.resetUserPassword(id, body.newPassword);
  }

  // ── Analytics & Audit ──────────────────────────────────
  @Get('analytics')
  getAnalytics(): any {
    return this.adminService.getAnalytics();
  }

  @Get('audit-logs')
  getAuditLogs(@Query('email') email?: string): any {
    return this.adminService.getAuditLogs(email);
  }
}
