import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

interface Investment {
  id: string;
  userId: string;
  type: string;
  value: number;
  growth: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'closed';
  transactions: InvestmentTransaction[];
  riskLevel: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

interface InvestmentTransaction {
  id: string;
  investmentId: string;
  type: 'buy' | 'sell' | 'dividend' | 'fee';
  amount: number;
  currency: string;
  timestamp: Date;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class InvestmentsService {
  private investments: Investment[] = [];
  private transactions: InvestmentTransaction[] = [];

  constructor() {
    this.seedInvestments();
  }

  private seedInvestments() {
    const userId = 'user-001';
    const now = new Date();
    this.investments = [
      {
        id: uuidv4(),
        userId,
        type: 'Stocks',
        value: 2500,
        growth: 3.2,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        transactions: [],
        riskLevel: 'medium',
      },
      {
        id: uuidv4(),
        userId,
        type: 'ETFs',
        value: 900,
        growth: 2.1,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        transactions: [],
        riskLevel: 'low',
      },
      {
        id: uuidv4(),
        userId,
        type: 'Crypto',
        value: 800,
        growth: 5.7,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        transactions: [],
        riskLevel: 'high',
      },
      {
        id: uuidv4(),
        userId,
        type: 'Index Funds',
        value: 1000,
        growth: 1.8,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        transactions: [],
        riskLevel: 'low',
      },
    ];
  }

  getInvestments(userId?: string): Investment[] {
    if (userId) {
      return this.investments.filter(i => i.userId === userId);
    }
    return this.investments;
  }

  getInvestmentById(investmentId: string): Investment {
    const inv = this.investments.find(i => i.id === investmentId);
    if (!inv) throw new NotFoundException('Investment not found');
    return inv;
  }

  createInvestment(userId: string, type: string, value: number, currency = 'USD', riskLevel: 'low' | 'medium' | 'high' = 'medium'): Investment {
    if (!userId || !type || !value || value <= 0) throw new BadRequestException('Missing or invalid fields');
    const now = new Date();
    const investment: Investment = {
      id: uuidv4(),
      userId,
      type,
      value,
      growth: 0,
      currency,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      transactions: [],
      riskLevel,
    };
    this.investments.push(investment);
    return investment;
  }

  buy(investmentId: string, amount: number, description = 'Buy'): InvestmentTransaction {
    const inv = this.getInvestmentById(investmentId);
    if (inv.status !== 'active') throw new BadRequestException('Investment not active');
    if (amount <= 0) throw new BadRequestException('Invalid amount');
    inv.value += amount;
    inv.updatedAt = new Date();
    const tx = this.createTransaction(inv.id, 'buy', amount, inv.currency, description);
    inv.transactions.push(tx);
    this.transactions.push(tx);
    return tx;
  }

  sell(investmentId: string, amount: number, description = 'Sell'): InvestmentTransaction {
    const inv = this.getInvestmentById(investmentId);
    if (inv.status !== 'active') throw new BadRequestException('Investment not active');
    if (amount <= 0 || amount > inv.value) throw new BadRequestException('Invalid amount');
    inv.value -= amount;
    inv.updatedAt = new Date();
    const tx = this.createTransaction(inv.id, 'sell', amount, inv.currency, description);
    inv.transactions.push(tx);
    this.transactions.push(tx);
    return tx;
  }

  closeInvestment(investmentId: string): Investment {
    const inv = this.getInvestmentById(investmentId);
    inv.status = 'closed';
    inv.updatedAt = new Date();
    return inv;
  }

  getInvestmentTransactions(investmentId: string): InvestmentTransaction[] {
    const inv = this.getInvestmentById(investmentId);
    return inv.transactions;
  }

  getAllInvestmentTransactions(): InvestmentTransaction[] {
    return this.transactions;
  }

  private createTransaction(investmentId: string, type: InvestmentTransaction['type'], amount: number, currency: string, description: string): InvestmentTransaction {
    return {
      id: uuidv4(),
      investmentId,
      type,
      amount,
      currency,
      timestamp: new Date(),
      description,
      status: 'completed',
      reference: Math.random().toString(36).substring(2, 10),
    };
  }

  getPortfolio(): { portfolio: object } {
    const active = this.investments.filter(i => i.status === 'active' && i.userId === 'user-001');
    const typeToId: Record<string, string> = {};
    active.forEach(inv => { typeToId[inv.type] = inv.id; });

    const HOLDINGS_DEF = [
      { ticker: 'AAPL', name: 'Apple Inc.',          investmentType: 'Stocks',      shares: 10,    avgCost: 155.0,  currentPrice: 189.5, dayChangePct: 1.2  },
      { ticker: 'MSFT', name: 'Microsoft Corp.',      investmentType: 'Stocks',      shares: 5,     avgCost: 320.0,  currentPrice: 375.0, dayChangePct: -0.4 },
      { ticker: 'VTI',  name: 'Vanguard Total Mkt',   investmentType: 'ETFs',        shares: 8,     avgCost: 195.0,  currentPrice: 225.0, dayChangePct: 0.8  },
      { ticker: 'BTC',  name: 'Bitcoin',              investmentType: 'Crypto',      shares: 0.012, avgCost: 38000,  currentPrice: 43200, dayChangePct: 2.1  },
      { ticker: 'VNQ',  name: 'Vanguard REIT ETF',    investmentType: 'Index Funds', shares: 15,    avgCost: 82.0,   currentPrice: 88.0,  dayChangePct: -0.2 },
      { ticker: 'AGG',  name: 'iShares Bond ETF',     investmentType: 'ETFs',        shares: 20,    avgCost: 98.0,   currentPrice: 96.5,  dayChangePct: 0.3  },
    ];

    const holdings = HOLDINGS_DEF.map((h, i) => {
      const value   = parseFloat((h.shares * h.currentPrice).toFixed(2));
      const pl      = parseFloat((h.shares * (h.currentPrice - h.avgCost)).toFixed(2));
      const plPct   = parseFloat(((pl / (h.shares * h.avgCost)) * 100).toFixed(1));
      return {
        id: `h${i}`,
        investmentId: typeToId[h.investmentType] ?? null,
        ticker: h.ticker,
        name: h.name,
        shares: h.shares,
        avgCost: h.avgCost,
        currentPrice: h.currentPrice,
        value,
        pl,
        plPct,
        dayChangePct: h.dayChangePct,
      };
    });

    const totalValue    = parseFloat(holdings.reduce((s, h) => s + h.value, 0).toFixed(2));
    const totalPl       = parseFloat(holdings.reduce((s, h) => s + h.pl,    0).toFixed(2));
    const costBasis     = parseFloat((totalValue - totalPl).toFixed(2));
    const totalPlPct    = costBasis > 0 ? parseFloat(((totalPl / costBasis) * 100).toFixed(1)) : 0;
    const avgGrowth     = active.length > 0 ? parseFloat((active.reduce((s, i) => s + i.growth, 0) / active.length).toFixed(2)) : 0;
    const dayChange     = parseFloat((totalValue * 0.012).toFixed(2));
    const sentiment     = avgGrowth > 3 ? 'Bullish' : avgGrowth > 0 ? 'Positive' : 'Cautious';

    return {
      portfolio: {
        totalValue,
        totalPl,
        totalPlPct,
        changePercent: avgGrowth,
        dayChange,
        dayChangePct: 1.2,
        sentiment,
        currency: '$',
        holdings,
        allocation: [
          { label: 'Equities',     pct: 48, color: '#C4A052' },
          { label: 'Fixed Income', pct: 28, color: '#3D9E7A' },
          { label: 'Real Estate',  pct: 14, color: '#9b8fbf' },
          { label: 'Cash & Crypto',pct: 10, color: '#A2B2BF' },
        ],
      },
    };
  }

  // ... (expand with analytics, risk assessment, portfolio optimization, notifications, etc.)
}
