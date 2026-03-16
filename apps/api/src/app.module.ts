import { Module } from '@nestjs/common';
import { AccountsModule } from './modules/accounts.module';
import { TransferModule } from './modules/transfer.module';
import { VaultsModule } from './modules/vaults.module';
import { InvestmentsModule } from './modules/investments.module';
import { InsightsModule } from './modules/insights.module';
import { AuthModule } from './modules/auth.module';
import { AdminModule } from './modules/admin.module';
import { SecurityModule } from './modules/security/security.module';
import { NotificationModule } from './modules/notification.module';
import { ProfileModule } from './modules/profile.module';
import { CheckbookModule } from './modules/checkbook.module';
import { CardsModule } from './modules/cards.module';

@Module({
  imports: [
    AuthModule,
    AccountsModule,
    TransferModule,
    VaultsModule,
    InvestmentsModule,
    InsightsModule,
    AdminModule,
    SecurityModule,
    NotificationModule,
    ProfileModule,
    CheckbookModule,
    CardsModule,
  ],
})
export class AppModule {}
