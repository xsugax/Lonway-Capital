import { Module } from '@nestjs/common';
import { TwoFAModule } from './twofa.module';

@Module({
  imports: [TwoFAModule],
})
export class SecurityModule {}
