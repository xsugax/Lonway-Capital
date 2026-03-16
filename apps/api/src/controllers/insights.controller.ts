import { Controller, Get } from '@nestjs/common';
import { InsightsService } from '../services/insights.service';

@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  getInsights(): any {
    return this.insightsService.getInsights();
  }
}
