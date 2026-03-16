import { Module } from '@nestjs/common';
import { InsightsController } from '../controllers/insights.controller';
import { InsightsService } from '../services/insights.service';

@Module({
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
