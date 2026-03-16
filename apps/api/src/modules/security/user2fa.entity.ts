import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('user_2fa')
export class User2FA {
  @PrimaryColumn()
  userId: string;

  @Column()
  secret: string;

  @Column({ default: false })
  enabled: boolean;
}
