import { Module } from '@nestjs/common';
import { VaultsController } from '../controllers/vaults.controller';
import { VaultsService } from '../services/vaults.service';

@Module({
  controllers: [VaultsController],
  providers: [VaultsService],
  exports: [VaultsService],
})
export class VaultsModule {}
