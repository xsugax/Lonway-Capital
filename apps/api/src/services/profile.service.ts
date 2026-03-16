import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProfileService {
  private profiles: UserProfile[] = [];
  private logger = new Logger('ProfileService');

  createProfile(userId: string, displayName: string, avatarUrl?: string, bio?: string, preferences?: Record<string, any>) {
    const profile: UserProfile = {
      id: uuidv4(),
      userId,
      displayName,
      avatarUrl,
      bio,
      preferences,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.profiles.push(profile);
    this.logger.log(`Profile created for user ${userId}`);
    return profile;
  }

  getProfile(userId: string): UserProfile | undefined {
    return this.profiles.find(p => p.userId === userId);
  }

  updateProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt'>>) {
    const profile = this.profiles.find(p => p.userId === userId);
    if (!profile) return undefined;
    Object.assign(profile, updates, { updatedAt: new Date() });
    this.logger.log(`Profile updated for user ${userId}`);
    return profile;
  }

  deleteProfile(userId: string) {
    const idx = this.profiles.findIndex(p => p.userId === userId);
    if (idx !== -1) this.profiles.splice(idx, 1);
    this.logger.log(`Profile deleted for user ${userId}`);
    return true;
  }

  // ... (extend with privacy, preferences, audit, avatar upload, etc.)
}
