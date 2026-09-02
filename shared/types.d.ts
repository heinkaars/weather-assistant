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
  dewpoint?: {
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
