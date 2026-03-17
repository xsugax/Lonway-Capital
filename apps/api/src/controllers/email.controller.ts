import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { EmailService } from '../services/email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-code')
  async sendCode(@Body() body: { email: string; userName?: string }) {
    if (!body.email || !body.email.includes('@')) {
      throw new BadRequestException('Valid email required');
    }
    return this.emailService.generateAndSendCode(body.email, body.userName);
  }

  @Post('verify-code')
  verifyCode(@Body() body: { email: string; code: string }) {
    if (!body.email || !body.code) {
      throw new BadRequestException('Email and code required');
    }
    return this.emailService.verifyCode(body.email, body.code);
  }
}
