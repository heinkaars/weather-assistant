import type { WeatherPeriod, WeatherData } from '../../shared/types';

export type { WeatherPeriod, WeatherData };

export interface LocationData {
  name: string;
  coordinates: { lat: number; lon: number };
  weather: WeatherData;
}

export interface WeatherComparisonData {
  location1: LocationData;
  location2: LocationData;
}

export interface LocationSuggestion {
  location: string;
  lat: number;
  lon: number;
}

export interface LocationWithCoords {
  name: string;
  lat: number;
  lon: number;
}
