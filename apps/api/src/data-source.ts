import { DataSource } from 'typeorm';
import { User2FA } from './modules/security/user2fa.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'aurix.sqlite',
  synchronize: true,
  logging: false,
  entities: [User2FA],
});
