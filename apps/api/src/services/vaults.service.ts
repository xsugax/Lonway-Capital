import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

interface Vault {
  id: string;
  userId: string;
  name: string;
  saved: number;
  target: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived' | 'closed';
  transactions: VaultTransaction[];
  goalDate?: Date;
  metadata?: Record<string, any>;
}

interface VaultTransaction {
  id: string;
  vaultId: string;
  type: 'fund' | 'withdraw' | 'interest' | 'fee';
  amount: number;
  currency: string;
  timestamp: Date;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class VaultsService {
  private vaults: Vault[] = [];
  private transactions: VaultTransaction[] = [];

  constructor() {
    this.seedVaults();
  }

  private seedVaults() {
    const userId = 'user-001';
    const now = new Date();
    this.vaults = [
      {
        id: uuidv4(),
        userId,
        name: 'Travel Fund',
        saved: 1200,
        target: 5000,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        transactions: [],
        goalDate: new Date(now.getFullYear(), now.getMonth() + 12, now.getDate()),
      },
      {
        id: uuidv4(),
        userId,
        name: 'Emergency Fund',
        saved: 2500,
        target: 10000,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        transactions: [],
      },
      {
        id: uuidv4(),
        userId,
        name: 'Home Fund',
        saved: 3000,
        target: 50000,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        transactions: [],
      },
    ];
  }

  getVaults(userId?: string): Vault[] {
    if (userId) {
      return this.vaults.filter(v => v.userId === userId);
    }
    return this.vaults;
  }

  getVaultById(vaultId: string): Vault {
    const vault = this.vaults.find(v => v.id === vaultId);
    if (!vault) throw new NotFoundException('Vault not found');
    return vault;
  }

  createVault(userId: string, name: string, target: number, currency = 'USD', goalDate?: Date): Vault {
    if (!userId || !name || !target || target <= 0) throw new BadRequestException('Missing or invalid fields');
    const now = new Date();
    const vault: Vault = {
      id: uuidv4(),
      userId,
      name,
      saved: 0,
      target,
      currency,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      transactions: [],
      goalDate,
    };
    this.vaults.push(vault);
    return vault;
  }

  fundVault(vaultId: string, amount: number, description = 'Fund Vault'): VaultTransaction {
    const vault = this.getVaultById(vaultId);
    if (vault.status !== 'active') throw new BadRequestException('Vault not active');
    if (amount <= 0) throw new BadRequestException('Invalid amount');
    vault.saved += amount;
    vault.updatedAt = new Date();
    const tx = this.createTransaction(vault.id, 'fund', amount, vault.currency, description);
    vault.transactions.push(tx);
    this.transactions.push(tx);
    return tx;
  }

  withdrawFromVault(vaultId: string, amount: number, description = 'Withdraw from Vault'): VaultTransaction {
    const vault = this.getVaultById(vaultId);
    if (vault.status !== 'active') throw new BadRequestException('Vault not active');
    if (amount <= 0 || amount > vault.saved) throw new BadRequestException('Invalid amount');
    vault.saved -= amount;
    vault.updatedAt = new Date();
    const tx = this.createTransaction(vault.id, 'withdraw', amount, vault.currency, description);
    vault.transactions.push(tx);
    this.transactions.push(tx);
    return tx;
  }

  closeVault(vaultId: string): Vault {
    const vault = this.getVaultById(vaultId);
    vault.status = 'closed';
    vault.updatedAt = new Date();
    return vault;
  }

  archiveVault(vaultId: string): Vault {
    const vault = this.getVaultById(vaultId);
    vault.status = 'archived';
    vault.updatedAt = new Date();
    return vault;
  }

  getVaultTransactions(vaultId: string): VaultTransaction[] {
    const vault = this.getVaultById(vaultId);
    return vault.transactions;
  }

  getAllVaultTransactions(): VaultTransaction[] {
    return this.transactions;
  }

  private createTransaction(vaultId: string, type: VaultTransaction['type'], amount: number, currency: string, description: string): VaultTransaction {
    return {
      id: uuidv4(),
      vaultId,
      type,
      amount,
      currency,
      timestamp: new Date(),
      description,
      status: 'completed',
      reference: uuidv4().replace(/-/g, '').slice(0, 16),
    };
  }

  // ... (expand with analytics, auto-funding, goal tracking, notifications, etc.)
}
