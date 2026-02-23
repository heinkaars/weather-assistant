import express from 'express';
import { geocodeCache, generateCacheKey } from '../cache.js';

export const geocodeRouter = express.Router();

const USER_AGENT = 'FogCast/1.0 (US Weather Comparison App)';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Rate limiting: 1 request per second to Nominatim
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

// Helper to enhance location query for US context (smart enhancement)
const enhanceLocationQuery = (location: string): string => {
  const lower = location.toLowerCase();
  
  // Already has context (state, country, or major city)
  const hasContext = 
    /\b(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)\b/i.test(location) ||
    lower.includes('usa') || lower.includes('united states') ||
    lower.includes(','); // Has comma, likely formatted address
  
  if (hasContext) {
    return location;
  }
  
  // Check if it looks like a full address (has numbers and street)
  const hasNumbers = /\d/.test(location);
  const hasStreetKeywords = /(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|way|lane|ln|circle|ct|court|place|pl)/i.test(location);
  
  if (hasNumbers && hasStreetKeywords) {
    // Full address without state - add US context
    return `${location}, United States`;
  }
  
  // Ambiguous single/double word query - add US context to prioritize US results
  const wordCount = location.trim().split(/\s+/).length;
  if (wordCount <= 2) {
    return `${location}, United States`;
  }
  
  // Otherwise leave as-is
  return location;
};

const rateLimitedFetch = async (url: string): Promise<Response> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });
};

geocodeRouter.get('/', async (req, res) => {
  try {
    const { location, autocomplete } = req.query;

    if (!location || typeof location !== 'string') {
      return res.status(400).json({ error: 'Location parameter is required' });
    }

    const isAutocomplete = autocomplete === 'true';

    // Check cache first (only for non-autocomplete requests)
    if (!isAutocomplete) {
      const cacheKey = generateCacheKey('geocode', location);
      const cachedResult = geocodeCache.get(cacheKey);
      
      if (cachedResult) {
        console.log(`✓ Cache hit for geocode: ${location}`);
        return res.json({ ...cachedResult, cached: true });
      }
    }

    console.log(`→ Fetching geocode for: ${location}${isAutocomplete ? ' (autocomplete)' : ''}`);

    // For autocomplete, use raw query (no enhancement)
    // For final selection, use smart enhancement
    const searchQuery = isAutocomplete 
      ? location
      : enhanceLocationQuery(location);
    
    if (!isAutocomplete && searchQuery !== location) {
      console.log(`  Enhanced query: ${searchQuery}`);
    }

    // Geocode the location
    // For autocomplete: get more results, no bounding box
    // For final: fewer results with enhancement
    const limit = isAutocomplete ? 10 : 5;
    const countrycodes = 'us'; // Restrict to US only
    const searchUrl = `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=${limit}&countrycodes=${countrycodes}`;
    const response = await rateLimitedFetch(searchUrl);

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json() as any[];

    if (isAutocomplete) {
      console.log(`  Found ${data.length} results for autocomplete`);
    }

    if (!data || data.length === 0) {
      if (isAutocomplete) {
        // For autocomplete, return empty array instead of error
        return res.json({ suggestions: [] });
      }
      return res.status(404).json({ 
        error: 'Location not found',
        message: `Could not find "${location}". Try being more specific.`
      });
    }

    // For autocomplete, return multiple results
    if (isAutocomplete) {
      const suggestions = data
        .map((item: any) => ({
          location: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }))
        .slice(0, 5);

      console.log(`  Returning ${suggestions.length} suggestions`);
      return res.json({ suggestions });
    }

    // For final selection, use first result
    const selectedResult = data[0];
    const resultLat = parseFloat(selectedResult.lat);
    const resultLon = parseFloat(selectedResult.lon);

    const result = {
      location: selectedResult.display_name,
      lat: resultLat,
      lon: resultLon,
    };

    // Cache the result
    const cacheKey = generateCacheKey('geocode', location);
    geocodeCache.set(cacheKey, result);
    console.log(`✓ Cached geocode result for: ${location}`);

    res.json({ ...result, cached: false });
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({ 
      error: 'Failed to geocode location',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
