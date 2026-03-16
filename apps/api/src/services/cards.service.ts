import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export type CardTier = 'standard' | 'platinum' | 'gold' | 'black' | 'black_world_elite';
export type CardNetwork = 'debit' | 'mastercard';
export type CardStatus = 'pending' | 'processing' | 'shipped' | 'active' | 'blocked';

export interface PhysicalCard {
  id: string;
  userId: string;
  network: CardNetwork;
  tier: CardTier;
  holderName: string;
  deliveryAddress: string;
  city: string;
  country: string;
  status: CardStatus;
  requestedAt: Date;
  estimatedDelivery: Date;
  maskedNumber: string;
}

const DELIVERY_DAYS: Record<CardTier, number> = {
  standard: 14,
  platinum: 10,
  gold: 7,
  black: 5,
  black_world_elite: 3,
};

@Injectable()
export class CardsService {
  private cards: PhysicalCard[] = [];

  constructor() {
    this.cards = [];
  }

  getCards(userId?: string): PhysicalCard[] {
    return userId ? this.cards.filter(c => c.userId === userId) : this.cards;
  }

  requestCard(
    userId: string,
    network: CardNetwork,
    tier: CardTier,
    holderName: string,
    deliveryAddress: string,
    city: string,
    country: string,
  ): PhysicalCard {
    if (!network || !tier || !holderName?.trim() || !deliveryAddress?.trim() || !city?.trim() || !country?.trim()) {
      throw new BadRequestException('All fields are required');
    }
    const now = new Date();
    const days = DELIVERY_DAYS[tier] ?? 14;
    const estimatedDelivery = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const lastFour = String(Math.floor(1000 + Math.random() * 9000));
    const card: PhysicalCard = {
      id: uuidv4(),
      userId: userId ?? 'user-001',
      network,
      tier,
      holderName: holderName.toUpperCase().trim(),
      deliveryAddress,
      city,
      country,
      status: 'pending',
      requestedAt: now,
      estimatedDelivery,
      maskedNumber: `•••• •••• •••• ${lastFour}`,
    };
    this.cards.push(card);
    // Send admin notification for card request
    try {
      const notificationService = (global as any).notificationService;
      if (notificationService) {
        notificationService.sendNotification(
          'admin',
          `New card request by user ${userId} (${country || 'Unknown country'})`,
          'info',
          { cardId: card.id, country, network, tier }
        );
      }
    } catch (e) {}
    return card;
  }
}
