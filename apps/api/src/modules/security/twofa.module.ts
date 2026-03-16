import { Module } from '@nestjs/common';
import { TwoFAController } from './twofa.controller';

@Module({
  controllers: [TwoFAController],
})
export class TwoFAModule {}
