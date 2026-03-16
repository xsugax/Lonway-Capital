import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export type CheckbookStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'exhausted';
export type CheckStatus = 'unused' | 'used' | 'void' | 'bounced';

export interface Check {
  number: string;
  status: CheckStatus;
  payee?: string;
  amount?: number;
  memo?: string;
  date?: string;
}

export interface Checkbook {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  accountId: string;
  status: CheckbookStatus;
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  checkStart?: number;
  checkEnd?: number;
  checks: Check[];
  deliveryAddress?: string;
  notes?: string;
}

@Injectable()
export class CheckbookService {
  private checkbooks: Checkbook[] = [];

  constructor() {
    this.checkbooks = [];
  }

  requestCheckbook(body: {
    userId: string;
    userEmail: string;
    userName: string;
    accountId: string;
    deliveryAddress?: string;
    notes?: string;
  }): Checkbook {
    const cb: Checkbook = {
      id: uuidv4(),
      userId: body.userId,
      userEmail: body.userEmail,
      userName: body.userName,
      accountId: body.accountId,
      status: 'pending',
      requestedAt: new Date(),
      checks: [],
      deliveryAddress: body.deliveryAddress,
      notes: body.notes,
    };
    this.checkbooks.push(cb);
    // Send admin notification for checkbook request
    try {
      const notificationService = (global as any).notificationService;
      if (notificationService) {
        notificationService.sendNotification(
          'admin',
          `New checkbook request by user ${body.userId} (${body.deliveryAddress || 'Unknown address'})`,
          'info',
          { checkbookId: cb.id, deliveryAddress: body.deliveryAddress }
        );
      }
    } catch (e) {}
    return cb;
  }

  approveCheckbook(id: string, startNumber = 1001): Checkbook {
    const cb = this.checkbooks.find(c => c.id === id);
    if (!cb) throw new NotFoundException('Checkbook not found');
    if (cb.status !== 'pending') throw new BadRequestException('Checkbook is not pending');
    cb.status = 'active';
    cb.approvedAt = new Date();
    cb.checkStart = startNumber;
    cb.checkEnd = startNumber + 24; // 25 checks
    cb.checks = Array.from({ length: 25 }, (_, i) => ({
      number: String(startNumber + i),
      status: 'unused' as CheckStatus,
    }));
    return cb;
  }

  rejectCheckbook(id: string, reason?: string): Checkbook {
    const cb = this.checkbooks.find(c => c.id === id);
    if (!cb) throw new NotFoundException('Checkbook not found');
    if (cb.status !== 'pending') throw new BadRequestException('Checkbook is not pending');
    cb.status = 'rejected';
    cb.rejectedAt = new Date();
    cb.rejectionReason = reason;
    return cb;
  }

  updateCheck(checkbookId: string, checkNumber: string, update: Partial<Check>): Checkbook {
    const cb = this.checkbooks.find(c => c.id === checkbookId);
    if (!cb) throw new NotFoundException('Checkbook not found');
    const check = cb.checks.find(c => c.number === checkNumber);
    if (!check) throw new NotFoundException('Check not found');
    Object.assign(check, update);
    return cb;
  }

  getUserCheckbooks(userId: string): Checkbook[] {
    return this.checkbooks.filter(c => c.userId === userId);
  }

  getAllCheckbooks(): Checkbook[] {
    return this.checkbooks;
  }

  getPendingCheckbooks(): Checkbook[] {
    return this.checkbooks.filter(c => c.status === 'pending');
  }

  getCheckbookById(id: string): Checkbook {
    const cb = this.checkbooks.find(c => c.id === id);
    if (!cb) throw new NotFoundException('Checkbook not found');
    return cb;
  }
}
