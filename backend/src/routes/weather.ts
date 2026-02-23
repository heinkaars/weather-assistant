import express from 'express';
import { weatherCache, generateCacheKey } from '../cache.js';

export const weatherRouter = express.Router();

const USER_AGENT = 'FogCast/1.0 (Bay Area Weather App)';

interface GridPoint {
  properties: {
    forecast: string;
    forecastHourly: string;
  };
}

interface WeatherPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation?: {
    value: number | null;
  };
  relativeHumidity?: {
    value: number | null;
  };
  dewpoint?: {
    value: number | null;
  };
}

weatherRouter.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon || typeof lat !== 'string' || typeof lon !== 'string') {
      return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude values' });
    }

    // Check cache first
    const cacheKey = generateCacheKey('weather', lat, lon);
    const cachedResult = weatherCache.get(cacheKey);
    
    if (cachedResult) {
      console.log(`✓ Cache hit for weather: ${lat},${lon}`);
      return res.json({ ...cachedResult, cached: true });
    }

    console.log(`→ Fetching weather for: ${lat},${lon}`);

    // Step 1: Get grid point data
    const pointsUrl = `https://api.weather.gov/points/${latitude},${longitude}`;
    const pointsResponse = await fetch(pointsUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!pointsResponse.ok) {
      if (pointsResponse.status === 404) {
        return res.status(404).json({ 
          error: 'Location not supported',
          message: 'Weather.gov only covers US locations. Make sure your location is in the Bay Area.'
        });
      }
      throw new Error(`Weather.gov points API error: ${pointsResponse.status}`);
    }

    const pointsData = await pointsResponse.json() as GridPoint;
    const forecastHourlyUrl = pointsData.properties.forecastHourly;

    // Step 2: Get hourly forecast
    const forecastResponse = await fetch(forecastHourlyUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!forecastResponse.ok) {
      throw new Error(`Weather.gov forecast API error: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json() as any;
    const periods: WeatherPeriod[] = forecastData.properties.periods;

    // Get current conditions + today's hourly forecast (next 12 hours)
    const now = new Date();
    const todayPeriods = periods.slice(0, 12);

    const result = {
      location: { lat: latitude, lon: longitude },
      current: todayPeriods[0],
      hourly: todayPeriods,
      generatedAt: now.toISOString(),
    };

    // Cache the result
    weatherCache.set(cacheKey, result);
    console.log(`✓ Cached weather result for: ${lat},${lon}`);

    res.json({ ...result, cached: false });
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
