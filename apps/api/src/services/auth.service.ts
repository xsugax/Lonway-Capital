import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'auditor' | 'support';
  kyc: boolean;
  frozen: boolean;
  twoFAEnabled: boolean;
  twoFASecret?: string;
  lastLogin?: Date;
  failedLogins: number;
  lockedUntil?: Date;
  auditTrail: string[];
  sessionTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuthService {
  private users: User[] = [];
  private auditLogs: string[] = [];
  private logger = new Logger('AuthService');

  constructor() {
    // Seed with demo users
    this.users = [
      {
        id: uuidv4(),
        name: 'Jane Doe',
        email: 'user@londwaycapital.com',
        password: bcrypt.hashSync('password123', 10),
        role: 'user',
        kyc: true,
        frozen: false,
        twoFAEnabled: false,
        failedLogins: 0,
        auditTrail: [],
        sessionTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Admin',
        email: 'admin@londwaycapital.com',
        password: bcrypt.hashSync('adminpass', 10),
        role: 'admin',
        kyc: true,
        frozen: false,
        twoFAEnabled: true,
        twoFASecret: speakeasy.generateSecret().base32,
        failedLogins: 0,
        auditTrail: [],
        sessionTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Authenticate user and return JWT if successful. Handles lockout, 2FA, audit, and session management.
   */
  login(email: string, password: string, twoFACode?: string) {
    const user = this.users.find(u => u.email === email);
    if (!user) {
      this.logAudit('login_failed', email, 'User not found');
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.frozen) {
      this.logAudit('login_failed', email, 'Account frozen');
      throw new ForbiddenException('Account is frozen');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      this.logAudit('login_failed', email, 'Account locked');
      throw new ForbiddenException('Account is temporarily locked');
    }
    if (!bcrypt.compareSync(password, user.password)) {
      user.failedLogins++;
      if (user.failedLogins >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        this.logAudit('account_locked', email, 'Too many failed logins');
      }
      this.logAudit('login_failed', email, 'Wrong password');
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.twoFAEnabled) {
      if (!twoFACode || !user.twoFASecret || !speakeasy.totp.verify({ secret: user.twoFASecret, encoding: 'base32', token: twoFACode })) {
        this.logAudit('login_failed', email, '2FA failed');
        throw new UnauthorizedException('2FA code required or invalid');
      }
    }
    user.failedLogins = 0;
    user.lastLogin = new Date();
    user.updatedAt = new Date();
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, 'londway_secret', { expiresIn: '2h' });
    user.sessionTokens.push(token);
    this.logAudit('login_success', email, 'User logged in');
    return { success: true, token, user: this.sanitizeUser(user) };
  }

  /**
   * Register a new user with optional 2FA and KYC.
   */
  register(name: string, email: string, password: string, role: 'user' | 'admin' | 'auditor' | 'support' = 'user', kyc = false, enable2FA = false) {
    if (this.users.find(u => u.email === email)) {
      throw new BadRequestException('Email already registered');
    }
    const newUser: User = {
      id: uuidv4(),
      name,
      email,
      password: bcrypt.hashSync(password, 10),
      role,
      kyc,
      frozen: false,
      twoFAEnabled: enable2FA,
      twoFASecret: enable2FA ? speakeasy.generateSecret().base32 : undefined,
      failedLogins: 0,
      auditTrail: [],
      sessionTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    this.logAudit('register', email, 'User registered');
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, 'londway_secret', { expiresIn: '2h' });
    newUser.sessionTokens.push(token);
    return { success: true, token, user: this.sanitizeUser(newUser) };
  }

  /**
   * Disable 2FA for a user.
   */
  disable2FA(email: string) {
    const user = this.users.find(u => u.email === email);
    if (!user) throw new NotFoundException('User not found');
    if (!user.twoFAEnabled) throw new BadRequestException('2FA not enabled');
    user.twoFAEnabled = false;
    user.twoFASecret = undefined;
    user.updatedAt = new Date();
    this.logAudit('2fa_disabled', email, '2FA disabled');
    return { success: true };
  }

  /**
   * Validate a JWT and return user if valid.
   */
  validateToken(token: string) {
    try {
      const payload = jwt.verify(token, 'londway_secret') as any;
      const user = this.users.find(u => u.id === payload.id && u.sessionTokens.includes(token));
      if (!user) throw new UnauthorizedException('Invalid token');
      return this.sanitizeUser(user);
    } catch (e) {
      this.logAudit('token_invalid', '', 'JWT validation failed');
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Logout a user by invalidating a session token.
   */
  logout(token: string) {
    const user = this.users.find(u => u.sessionTokens.includes(token));
    if (!user) throw new UnauthorizedException('Invalid token');
    user.sessionTokens = user.sessionTokens.filter(t => t !== token);
    this.logAudit('logout', user.email, 'User logged out');
    return { success: true };
  }

  /**
   * Freeze or unfreeze a user account.
   */
  setFrozen(email: string, frozen: boolean) {
    const user = this.users.find(u => u.email === email);
    if (!user) throw new NotFoundException('User not found');
    user.frozen = frozen;
    user.updatedAt = new Date();
    this.logAudit(frozen ? 'account_frozen' : 'account_unfrozen', email, frozen ? 'Account frozen' : 'Account unfrozen');
    return { success: true };
  }

  /**
   * Change user password.
   */
  changePassword(email: string, oldPassword: string, newPassword: string) {
    const user = this.users.find(u => u.email === email);
    if (!user) throw new NotFoundException('User not found');
    if (!bcrypt.compareSync(oldPassword, user.password)) throw new UnauthorizedException('Old password incorrect');
    user.password = bcrypt.hashSync(newPassword, 10);
    user.updatedAt = new Date();
    this.logAudit('password_changed', email, 'Password changed');
    return { success: true };
  }

  /**
   * Get audit logs for a user or all users.
   */
  getAuditLogs(email?: string) {
    if (email) {
      const user = this.users.find(u => u.email === email);
      if (!user) throw new NotFoundException('User not found');
      return user.auditTrail;
    }
    return this.auditLogs;
  }

  /**
   * Internal: Log audit events for compliance and security.
   */
  private logAudit(event: string, email: string, message: string) {
    const log = `[${new Date().toISOString()}] [${event}] [${email}] ${message}`;
    this.auditLogs.push(log);
    if (email) {
      const user = this.users.find(u => u.email === email);
      if (user) user.auditTrail.push(log);
    }
    this.logger.log(log);
  }

  /**
   * Remove sensitive fields from user object.
   */
  private sanitizeUser(user: User) {
    const { password, twoFASecret, sessionTokens, ...rest } = user;
    return rest;
  }

  // ... (extend with session management, refresh tokens, device tracking, advanced audit, SSO, OAuth, RBAC, etc.)
}
