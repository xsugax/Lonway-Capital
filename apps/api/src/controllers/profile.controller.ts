import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ProfileService } from '../services/profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  createProfile(@Body() body: { userId: string; displayName: string; avatarUrl?: string; bio?: string; preferences?: any }) {
    return this.profileService.createProfile(body.userId, body.displayName, body.avatarUrl, body.bio, body.preferences);
  }

  @Get(':userId')
  getProfile(@Param('userId') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Patch(':userId')
  updateProfile(@Param('userId') userId: string, @Body() updates: any) {
    return this.profileService.updateProfile(userId, updates);
  }

  @Delete(':userId')
  deleteProfile(@Param('userId') userId: string) {
    return this.profileService.deleteProfile(userId);
  }

  // ... (extend with endpoints for privacy, preferences, avatar upload, etc.)
}
