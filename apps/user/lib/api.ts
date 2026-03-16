/**
 * Central API configuration.
 * Uses NEXT_PUBLIC_API_URL env variable (set in .env.local / .env.production).
 * Falls back to localhost:4000 for local development.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
