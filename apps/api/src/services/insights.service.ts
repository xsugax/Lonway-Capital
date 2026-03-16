import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

interface Insight {
  id: string;
  userId?: string;
  title: string;
  message: string;
  suggestions: string[];
  createdAt: Date;
  type: 'spending' | 'investment' | 'savings' | 'security' | 'custom';
  tags?: string[];
  aiScore?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class InsightsService {
  private insights: Insight[] = [];
  private logger = new Logger('InsightsService');

  constructor() {
    // Seed with demo insights
    this.insights = [
      {
        id: uuidv4(),
        title: 'Spending Alert',
        message: 'You spent 15% more on food this week compared to last week.',
        suggestions: [
          'Set a weekly food budget',
          'Consider investing in ETFs for diversification',
          'Review your recurring subscriptions',
        ],
        createdAt: new Date(),
        type: 'spending',
        tags: ['food', 'budget'],
        aiScore: 0.92,
      },
      {
        id: uuidv4(),
        title: 'Investment Opportunity',
        message: 'Your portfolio is underweight in technology stocks.',
        suggestions: [
          'Research top-performing tech ETFs',
          'Diversify your holdings',
        ],
        createdAt: new Date(),
        type: 'investment',
        tags: ['portfolio', 'diversification'],
        aiScore: 0.88,
      },
    ];
  }

  getInsights(userId?: string): { insights: Insight[] } {
    // In a real system, filter and personalize insights by userId, AI, and context
    this.logger.log(`Fetching insights for user: ${userId || 'all'}`);
    return { insights: this.insights };
  }

  addInsight(insight: Omit<Insight, 'id' | 'createdAt'>) {
    const newInsight: Insight = {
      ...insight,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.insights.push(newInsight);
    this.logger.log(`Added new insight: ${newInsight.title}`);
    return newInsight;
  }

  getInsightById(id: string) {
    const insight = this.insights.find(i => i.id === id);
    if (!insight) throw new Error('Insight not found');
    return insight;
  }

  deleteInsight(id: string) {
    const idx = this.insights.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Insight not found');
    const [deleted] = this.insights.splice(idx, 1);
    this.logger.log(`Deleted insight: ${deleted.title}`);
    return { success: true };
  }

  generateSpendingInsights(transactions: any[], userId: string) {
    // Simulate AI/ML analytics for spending
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avg = total / (transactions.length || 1);
    const insight: Insight = {
      id: uuidv4(),
      userId,
      title: 'Spending Pattern',
      message: `Your average transaction is $${avg.toFixed(2)}. Consider reviewing your largest expenses.`,
      suggestions: ['Review top 3 expenses', 'Set spending limits'],
      createdAt: new Date(),
      type: 'spending',
      aiScore: 0.85,
    };
    this.insights.push(insight);
    return insight;
  }

  generateInvestmentInsights(portfolio: any, userId: string) {
    // Simulate AI/ML analytics for investments
    const insight: Insight = {
      id: uuidv4(),
      userId,
      title: 'Portfolio Diversification',
      message: 'Your portfolio is heavily weighted in a single sector. Consider diversifying.',
      suggestions: ['Explore ETFs', 'Consult a financial advisor'],
      createdAt: new Date(),
      type: 'investment',
      aiScore: 0.91,
    };
    this.insights.push(insight);
    return insight;
  }

  generateSecurityInsights(userId: string, loginAttempts: number) {
    // Simulate security analytics
    if (loginAttempts > 3) {
      const insight: Insight = {
        id: uuidv4(),
        userId,
        title: 'Security Alert',
        message: 'Multiple failed login attempts detected. Consider enabling 2FA.',
        suggestions: ['Enable 2FA', 'Change your password'],
        createdAt: new Date(),
        type: 'security',
        aiScore: 0.97,
      };
      this.insights.push(insight);
      return insight;
    }
    return null;
  }

  // ... (extend with advanced AI, ML, reporting, trend analysis, anomaly detection, notifications, etc.)
}
