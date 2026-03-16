import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

interface Account {
  id: string;
  userId: string;
  type: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'frozen' | 'closed';
  transactions: Transaction[];
  metadata?: Record<string, any>;
}

interface Transaction {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest' | 'refund';
  amount: number;
  currency: string;
  timestamp: Date;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  counterparty?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AccountsService {
  private accounts: Account[] = [];
  private transactions: Transaction[] = [];

  constructor() {
    // Seed with demo data
    this.seedAccounts();
  }

  private seedAccounts() {
    const userId = 'user-001';
    const now = new Date();
    this.accounts = [
      {
        id: uuidv4(),
        userId,
        type: 'Checking',
        balance: 5200,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        transactions: [],
      },
      {
        id: uuidv4(),
        userId,
        type: 'Savings Vault',
        balance: 7800,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        transactions: [],
      },
      {
        id: uuidv4(),
        userId,
        type: 'Investment Wallet',
        balance: 4200,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        transactions: [],
      },
      {
        id: uuidv4(),
        userId,
        type: 'Crypto Vault',
        balance: 1252.62,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        transactions: [],
      },
    ];
  }

  getAccounts(userId?: string): Account[] {
    if (userId) {
      return this.accounts.filter(acc => acc.userId === userId);
    }
    return this.accounts;
  }

  getAccountById(accountId: string): Account {
    const acc = this.accounts.find(a => a.id === accountId);
    if (!acc) throw new NotFoundException('Account not found');
    return acc;
  }

  createAccount(userId: string, type: string, currency: string = 'USD'): Account {
    if (!userId || !type) throw new BadRequestException('Missing required fields');
    const now = new Date();
    const account: Account = {
      id: uuidv4(),
      userId,
      type,
      balance: 0,
      currency,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      transactions: [],
    };
    this.accounts.push(account);
    return account;
  }

  deposit(accountId: string, amount: number, description = 'Deposit'): Transaction {
    const acc = this.getAccountById(accountId);
    if (acc.status !== 'active') throw new BadRequestException('Account not active');
    if (amount <= 0) throw new BadRequestException('Invalid amount');
    acc.balance += amount;
    acc.updatedAt = new Date();
    const tx = this.createTransaction(acc.id, 'deposit', amount, acc.currency, description);
    acc.transactions.push(tx);
    this.transactions.push(tx);
    return tx;
  }

  withdraw(accountId: string, amount: number, description = 'Withdrawal'): Transaction {
    const acc = this.getAccountById(accountId);
    if (acc.status !== 'active') throw new BadRequestException('Account not active');
    if (amount <= 0 || amount > acc.balance) throw new BadRequestException('Invalid amount');
    acc.balance -= amount;
    acc.updatedAt = new Date();
    const tx = this.createTransaction(acc.id, 'withdrawal', amount, acc.currency, description);
    acc.transactions.push(tx);
    this.transactions.push(tx);
    return tx;
  }

  transfer(fromAccountId: string, toAccountId: string, amount: number, description = 'Transfer'): { fromTx: Transaction; toTx: Transaction } {
    const from = this.getAccountById(fromAccountId);
    const to = this.getAccountById(toAccountId);
    if (from.status !== 'active' || to.status !== 'active') throw new BadRequestException('Account not active');
    if (amount <= 0 || amount > from.balance) throw new BadRequestException('Invalid amount');
    from.balance -= amount;
    to.balance += amount;
    from.updatedAt = new Date();
    to.updatedAt = new Date();
    const fromTx = this.createTransaction(from.id, 'transfer', amount, from.currency, description, to.id);
    const toTx = this.createTransaction(to.id, 'deposit', amount, to.currency, 'Incoming transfer', from.id);
    from.transactions.push(fromTx);
    to.transactions.push(toTx);
    this.transactions.push(fromTx, toTx);
    return { fromTx, toTx };
  }

  freezeAccount(accountId: string): Account {
    const acc = this.getAccountById(accountId);
    acc.status = 'frozen';
    acc.updatedAt = new Date();
    return acc;
  }

  closeAccount(accountId: string): Account {
    const acc = this.getAccountById(accountId);
    acc.status = 'closed';
    acc.updatedAt = new Date();
    return acc;
  }

  getTransactionHistory(accountId: string): Transaction[] {
    const acc = this.getAccountById(accountId);
    return acc.transactions;
  }

  getAllTransactions(): Transaction[] {
    return this.transactions;
  }

  private createTransaction(accountId: string, type: Transaction['type'], amount: number, currency: string, description: string, counterparty?: string): Transaction {
    return {
      id: uuidv4(),
      accountId,
      type,
      amount,
      currency,
      timestamp: new Date(),
      description,
      status: 'completed',
      counterparty,
      reference: crypto.randomBytes(8).toString('hex'),
    };
  }

  // ... (continue expanding with analytics, fraud detection, scheduled transfers, notifications, etc.)
}
