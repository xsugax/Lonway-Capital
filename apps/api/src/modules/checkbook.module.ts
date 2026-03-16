import { Module } from '@nestjs/common';
import { CheckbookController } from '../controllers/checkbook.controller';
import { CheckbookService } from '../services/checkbook.service';

@Module({
  controllers: [CheckbookController],
  providers: [CheckbookService],
  exports: [CheckbookService],
})
export class CheckbookModule {}
