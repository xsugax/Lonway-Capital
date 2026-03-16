import { Controller, Post, Req, Res } from '@nestjs/common';

@Controller('2fa')
export class TwoFAController {
  @Post('setup')
  async setup(@Req() req, @Res() res) {
    await setup2FA(req, res);
  }

  @Post('enable')
  async enable(@Req() req, @Res() res) {
    await enable2FA(req, res);
  }

  @Post('verify')
  async verify(@Req() req, @Res() res) {
    await verify2FA(req, res);
  }
}

import { Request, Response } from 'express';
import { generate2FASecret, verify2FAToken } from '@aurix/security/lib/twofa';
import { AppDataSource } from '../../data-source';
import { User2FA } from './user2fa.entity';

export async function setup2FA(req: Request, res: Response) {
  const userId = req.user.id;
  const secretObj = generate2FASecret(userId);
  let repo = AppDataSource.getRepository(User2FA);
  let record = await repo.findOneBy({ userId });
  if (!record) {
    record = repo.create({ userId, secret: secretObj.base32, enabled: false });
  } else {
    record.secret = secretObj.base32;
    record.enabled = false;
  }
  await repo.save(record);
  res.json({ otpauth_url: secretObj.otpauth_url, secret: secretObj.base32 });
}


export async function enable2FA(req: Request, res: Response) {
  const userId = req.user.id;
  const { token } = req.body;
  const repo = AppDataSource.getRepository(User2FA);
  const record = await repo.findOneBy({ userId });
  if (!record) return res.status(400).json({ success: false, message: '2FA not setup' });
  const valid = verify2FAToken(record.secret, token);
  if (valid) {
    record.enabled = true;
    await repo.save(record);
    return res.json({ success: true });
  }
  res.status(400).json({ success: false, message: 'Invalid token' });
}

export async function verify2FA(req: Request, res: Response) {
  const userId = req.user.id;
  const { token } = req.body;
  const repo = AppDataSource.getRepository(User2FA);
  const record = await repo.findOneBy({ userId });
  if (!record || !record.enabled) return res.status(400).json({ success: false, message: '2FA not enabled' });
  const valid = verify2FAToken(record.secret, token);
  if (valid) return res.json({ success: true });
  res.status(400).json({ success: false, message: 'Invalid token' });
}
