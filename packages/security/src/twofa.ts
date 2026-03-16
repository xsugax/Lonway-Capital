import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

export interface Device {
  id: string;
  userId: string;
  deviceName: string;
  lastUsed: Date;
  trusted: boolean;
  metadata?: Record<string, any>;
}

const deviceStore: Device[] = [];

export function generate2FASecret(userId: string) {
  return speakeasy.generateSecret({ name: `Londway Capital (${userId})` });
}

export function verify2FAToken(secret: string, token: string) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2
  });
}

export function registerDevice(userId: string, deviceName: string, trusted = false, metadata?: Record<string, any>): Device {
  const id = crypto.randomUUID();
  const device: Device = {
    id,
    userId,
    deviceName,
    lastUsed: new Date(),
    trusted,
    metadata,
  };
  deviceStore.push(device);
  return device;
}

export function getDevicesForUser(userId: string): Device[] {
  return deviceStore.filter(d => d.userId === userId);
}

export function updateDeviceLastUsed(deviceId: string) {
  const device = deviceStore.find(d => d.id === deviceId);
  if (device) device.lastUsed = new Date();
  return device;
}

export function removeDevice(deviceId: string) {
  const idx = deviceStore.findIndex(d => d.id === deviceId);
  if (idx !== -1) deviceStore.splice(idx, 1);
  return true;
}

// ... (extend with session management, device fingerprinting, anomaly detection, advanced security analytics, etc.)
