import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CardsService, CardNetwork, CardTier } from '../services/cards.service';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  getCards(@Query('userId') userId?: string) {
    return { cards: this.cardsService.getCards(userId) };
  }

  @Post('request')
  requestCard(
    @Body() body: {
      userId?: string;
      network: CardNetwork;
      tier: CardTier;
      holderName: string;
      deliveryAddress: string;
      city: string;
      country: string;
    },
  ) {
    return this.cardsService.requestCard(
      body.userId ?? 'user-001',
      body.network,
      body.tier,
      body.holderName,
      body.deliveryAddress,
      body.city,
      body.country,
    );
  }
}
