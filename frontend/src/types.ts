export interface WeatherPeriod {
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
}

export interface WeatherData {
  location: { lat: number; lon: number };
  current: WeatherPeriod;
  hourly: WeatherPeriod[];
  generatedAt: string;
  cached?: boolean;
}

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
