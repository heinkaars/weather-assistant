import NodeCache from 'node-cache';

// Cache TTL: 10 minutes (600 seconds)
const CACHE_TTL = 600;

// Create cache instances
export const geocodeCache = new NodeCache({ stdTTL: CACHE_TTL });
export const weatherCache = new NodeCache({ stdTTL: CACHE_TTL });

// Helper to generate cache keys
export const generateCacheKey = (prefix: string, ...parts: string[]): string => {
  return `${prefix}:${parts.join(':')}`.toLowerCase();
};
