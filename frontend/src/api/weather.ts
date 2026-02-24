import type { WeatherComparisonData, WeatherData, LocationSuggestion, LocationWithCoords } from '../types';

// Use env in production (e.g. Render backend URL); same-origin /api in dev (Vite proxy)
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

interface GeocodeResponse {
  location: string;
  lat: number;
  lon: number;
  cached?: boolean;
}

export async function geocodeLocation(location: string): Promise<GeocodeResponse> {
  const response = await fetch(`${API_BASE}/geocode?location=${encodeURIComponent(location)}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to geocode location');
  }
  
  return response.json();
}

export async function fetchLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  if (query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE}/geocode?location=${encodeURIComponent(query)}&autocomplete=true`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.suggestions || [];
    }
    return [];
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const response = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch weather data');
  }
  
  return response.json();
}

export async function fetchWeatherComparison(
  location1: string | LocationWithCoords,
  location2: string | LocationWithCoords
): Promise<WeatherComparisonData> {
  // If we have coordinates, use them directly; otherwise geocode
  const geo1 = typeof location1 === 'string' 
    ? await geocodeLocation(location1)
    : { location: location1.name, lat: location1.lat, lon: location1.lon };
  
  const geo2 = typeof location2 === 'string'
    ? await geocodeLocation(location2)
    : { location: location2.name, lat: location2.lat, lon: location2.lon };

  // Fetch weather for both locations
  const [weather1, weather2] = await Promise.all([
    fetchWeather(geo1.lat, geo1.lon),
    fetchWeather(geo2.lat, geo2.lon),
  ]);

  return {
    location1: {
      name: geo1.location,
      coordinates: { lat: geo1.lat, lon: geo1.lon },
      weather: weather1,
    },
    location2: {
      name: geo2.location,
      coordinates: { lat: geo2.lat, lon: geo2.lon },
      weather: weather2,
    },
  };
}

export async function fetchRecommendations(
  location1: string,
  location2: string,
  weather1: WeatherData,
  weather2: WeatherData
): Promise<string> {
  const response = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      location1,
      location2,
      weather1,
      weather2,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch recommendations');
  }

  const data = await response.json();
  return data.recommendations;
}
