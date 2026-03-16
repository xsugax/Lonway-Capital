import { Module } from '@nestjs/common';
import { CardsController } from '../controllers/cards.controller';
import { CardsService } from '../services/cards.service';

@Module({
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
