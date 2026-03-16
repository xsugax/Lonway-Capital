import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export type TransferType = 'local' | 'international';
export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed' | 'reversed';

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  recipientName: string;
  amount: number;
  currency: string;
  type: TransferType;
  status: TransferStatus;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  reference: string;
  auditTrail: string[];
  // International fields
  iban?: string;
  swift?: string;
  country?: string;
  bankName?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class TransferService {
  private transfers: Transfer[] = [];

  constructor() {
    this.transfers = [];
  }

  initiateTransfer(body: {
    fromAccountId: string;
    recipientName: string;
    toAccountId: string;
    amount: number;
    currency: string;
    type: TransferType;
    description?: string;
    iban?: string;
    swift?: string;
    country?: string;
    bankName?: string;
    metadata?: Record<string, any>;
  }): Transfer {
    const { fromAccountId, recipientName, toAccountId, amount, currency, type, description, iban, swift, country, bankName, metadata } = body;
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) throw new BadRequestException('Invalid transfer details');
    const now = new Date();
    const transfer: Transfer = {
      id: uuidv4(),
      fromAccountId,
      toAccountId,
      recipientName: recipientName || toAccountId,
      amount,
      currency: currency || 'USD',
      type: type || 'local',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      description: description || 'Transfer',
      reference: 'AX' + uuidv4().replace(/-/g, '').substr(0, 8).toUpperCase(),
      auditTrail: [`Initiated at ${now.toISOString()}`],
      iban,
      swift,
      country,
      bankName,
      metadata,
    };
    this.transfers.push(transfer);
    // Send admin notification for site click/location
    try {
      const notificationService = (global as any).notificationService;
      if (notificationService) {
        notificationService.sendNotification(
          'admin',
          `New transfer submitted by user ${fromAccountId} (${country || 'Unknown country'})`,
          'info',
          { transferId: transfer.id, country, amount, currency }
        );
      }
    } catch (e) {}
    return transfer;
  }

  approveTransfer(transferId: string): Transfer {
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'pending') throw new BadRequestException('Transfer is not pending');
    transfer.status = 'approved';
    transfer.updatedAt = new Date();
    transfer.auditTrail.push(`Approved at ${transfer.updatedAt.toISOString()}`);
    return transfer;
  }

  rejectTransfer(transferId: string, reason?: string): Transfer {
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'pending') throw new BadRequestException('Transfer is not pending');
    transfer.status = 'rejected';
    transfer.updatedAt = new Date();
    transfer.auditTrail.push(`Rejected at ${transfer.updatedAt.toISOString()}${reason ? ': ' + reason : ''}`);
    return transfer;
  }

  completeTransfer(transferId: string): Transfer {
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'approved') throw new BadRequestException('Transfer must be approved first');
    transfer.status = 'completed';
    transfer.updatedAt = new Date();
    transfer.auditTrail.push(`Completed at ${transfer.updatedAt.toISOString()}`);
    return transfer;
  }

  failTransfer(transferId: string, reason: string): Transfer {
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');
    transfer.status = 'failed';
    transfer.updatedAt = new Date();
    transfer.auditTrail.push(`Failed at ${transfer.updatedAt.toISOString()}: ${reason}`);
    return transfer;
  }

  reverseTransfer(transferId: string, reason: string): Transfer {
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'completed') throw new BadRequestException('Only completed transfers can be reversed');
    transfer.status = 'reversed';
    transfer.updatedAt = new Date();
    transfer.auditTrail.push(`Reversed at ${transfer.updatedAt.toISOString()}: ${reason}`);
    return transfer;
  }

  getTransferById(transferId: string): Transfer {
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');
    return transfer;
  }

  getTransfersForAccount(accountId: string): Transfer[] {
    return this.transfers.filter(t => t.fromAccountId === accountId || t.toAccountId === accountId);
  }

  getPendingTransfers(): Transfer[] {
    return this.transfers.filter(t => t.status === 'pending');
  }

  getAllTransfers(): Transfer[] {
    return this.transfers;
  }
}
