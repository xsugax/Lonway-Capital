import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'auditor' | 'support';
  frozen: boolean;
  kyc: boolean;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  auditTrail: string[];
  metadata?: Record<string, any>;
}

@Injectable()
export class AdminService {
  private users: AdminUser[] = [];
  private auditLogs: string[] = [];
  private logger = new Logger('AdminService');

  constructor() {
    this.users = [
      {
        id: uuidv4(),
        name: 'Jane Doe',
        email: 'user@londwaycapital.com',
        password: '',
        role: 'user',
        frozen: false,
        kyc: true,
        balance: 18452.62,
        createdAt: new Date(),
        updatedAt: new Date(),
        auditTrail: [],
      },
      {
        id: uuidv4(),
        name: 'Admin',
        email: 'admin@londwaycapital.com',
        password: '',
        role: 'admin',
        frozen: false,
        kyc: true,
        balance: 1000000,
        createdAt: new Date(),
        updatedAt: new Date(),
        auditTrail: [],
      },
    ];
  }

  getUsers() {
    return this.users.map(u => this.sanitizeUser(u));
  }

  getUserById(id: string) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  freezeUser(id: string) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');
    user.frozen = true;
    user.updatedAt = new Date();
    this.logAudit('account_frozen', user.email, 'Account frozen');
    return { success: true, user: this.sanitizeUser(user) };
  }

  unfreezeUser(id: string) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');
    user.frozen = false;
    user.updatedAt = new Date();
    this.logAudit('account_unfrozen', user.email, 'Account unfrozen');
    return { success: true, user: this.sanitizeUser(user) };
  }

  fundUser(id: string, amount: number) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    user.balance += amount;
    user.updatedAt = new Date();
    this.logAudit('funded', user.email, `Funded with ${amount}`);
    return { success: true, user: this.sanitizeUser(user) };
  }

  debitUser(id: string, amount: number) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (user.balance < amount) throw new ForbiddenException('Insufficient balance');
    user.balance -= amount;
    user.updatedAt = new Date();
    this.logAudit('debited', user.email, `Debited ${amount}`);
    return { success: true, user: this.sanitizeUser(user) };
  }

  setKycStatus(id: string, kyc: boolean) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');
    user.kyc = kyc;
    user.updatedAt = new Date();
    this.logAudit('kyc_status', user.email, `KYC set to ${kyc}`);
    return { success: true, user: this.sanitizeUser(user) };
  }

  createUser(name: string, email: string, password: string, role: 'user' | 'admin' | 'auditor' | 'support' = 'user', kyc = false, balance = 0) {
    if (this.users.find(u => u.email === email)) throw new BadRequestException('Email already exists');
    const user: AdminUser = {
      id: uuidv4(),
      name,
      email,
      password,
      role,
      frozen: false,
      kyc,
      balance,
      createdAt: new Date(),
      updatedAt: new Date(),
      auditTrail: [],
    };
    this.users.push(user);
    this.logAudit('user_created', email, 'User created');
    return this.sanitizeUser(user);
  }

  deleteUser(id: string) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) throw new NotFoundException('User not found');
    const [user] = this.users.splice(idx, 1);
    this.logAudit('user_deleted', user.email, 'User deleted');
    return { success: true };
  }

  getAnalytics() {
    return {
      totalUsers: this.users.length,
      totalBalance: this.users.reduce((sum, u) => sum + u.balance, 0),
      frozenAccounts: this.users.filter(u => u.frozen).length,
      kycVerified: this.users.filter(u => u.kyc).length,
      admins: this.users.filter(u => u.role === 'admin').length,
      createdLast30d: this.users.filter(u => (Date.now() - u.createdAt.getTime()) < 30 * 24 * 60 * 60 * 1000).length,
    };
  }

  getAuditLogs(email?: string) {
    if (email) {
      const user = this.users.find(u => u.email === email);
      if (!user) throw new NotFoundException('User not found');
      return user.auditTrail;
    }
    return this.auditLogs;
  }

  changeUserRole(id: string, role: 'user' | 'admin' | 'auditor' | 'support') {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    user.updatedAt = new Date();
    this.logAudit('role_changed', user.email, `Role changed to ${role}`);
    return { success: true, user: this.sanitizeUser(user) };
  }

  resetUserPassword(id: string, newPassword: string) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');
    user.password = newPassword;
    user.updatedAt = new Date();
    this.logAudit('password_reset', user.email, 'Password reset by admin');
    return { success: true };
  }

  private logAudit(event: string, email: string, message: string) {
    const log = `[${new Date().toISOString()}] [${event}] [${email}] ${message}`;
    this.auditLogs.push(log);
    const user = this.users.find(u => u.email === email);
    if (user) user.auditTrail.push(log);
    this.logger.log(log);
  }

  private sanitizeUser(user: AdminUser) {
    const { password, ...rest } = user;
    return rest;
  }
}
