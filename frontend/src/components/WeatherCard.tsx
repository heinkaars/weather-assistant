import type { WeatherData } from '../types';

interface WeatherCardProps {
  title: string;
  location: string;
  weather: WeatherData;
}

export default function WeatherCard({ title, location, weather }: WeatherCardProps) {
  const { current } = weather;

  // Get weather emoji based on conditions
  const getWeatherEmoji = (forecast: string) => {
    const lower = forecast.toLowerCase();
    if (lower.includes('rain') || lower.includes('shower')) return '🌧️';
    if (lower.includes('storm')) return '⛈️';
    if (lower.includes('snow')) return '❄️';
    if (lower.includes('fog')) return '🌁';
    if (lower.includes('cloud') || lower.includes('overcast')) return '☁️';
    if (lower.includes('partly')) return '⛅';
    if (lower.includes('clear') || lower.includes('sunny')) return '☀️';
    return '🌤️';
  };

  // Helper to format location for display: "Number Street, City" or "Place, City"
  const formatLocation = (loc: string) => {
    const parts = loc.split(', ');
    
    if (parts.length < 2) {
      return { short: loc, full: loc };
    }
    
    // Nominatim format: [Street/Place], [City/Neighborhood], [County], [State], [ZIP], [Country]
    // We want: [Street/Place], [City]
    
    // Get first part (street/place) - clean up address ranges like "646;648"
    let place = parts[0].replace(/;/g, ', ');
    
    // Find city: skip counties (contain "County"), skip ZIP codes (all digits), skip states, skip "United States"
    const usStates = ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Oregon', 
                      'Nevada', 'Arizona', 'Colorado', 'Massachusetts', 'Pennsylvania', 'Ohio', 'Michigan',
                      'Georgia', 'North Carolina', 'New Jersey', 'Virginia', 'Maryland', 'Tennessee'];
    
    let city = '';
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      // Skip if it's a county, ZIP code, state name, or "United States"
      if (!part.includes('County') && 
          !/^\d+$/.test(part) && 
          !usStates.includes(part) &&
          part !== 'United States') {
        city = part;
        break;
      }
    }
    
    // If no city found, use second part
    if (!city && parts.length > 1) {
      city = parts[1];
    }
    
    // Format: "Place, City"
    const short = city ? `${place}, ${city}` : place;
    
    return { short, full: loc };
  };

  const formattedLocation = formatLocation(location);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-white to-gray-50">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p 
          className="text-sm text-gray-700 leading-snug" 
          title={formattedLocation.full}
        >
          {formattedLocation.short}
        </p>
      </div>

      {/* Current Conditions */}
      <div className="flex items-start gap-4 mb-4">
        <div className="text-5xl">{getWeatherEmoji(current.shortForecast)}</div>
        <div>
          <div className="text-4xl font-bold text-gray-900">
            {current.temperature}°{current.temperatureUnit}
          </div>
          <div className="text-sm text-gray-600 mt-1">{current.shortForecast}</div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Wind:</span>
          <span className="font-medium text-gray-900">{current.windSpeed}</span>
        </div>
        {current.relativeHumidity?.value && (
          <div className="flex justify-between">
            <span className="text-gray-600">Humidity:</span>
            <span className="font-medium text-gray-900">{current.relativeHumidity.value}%</span>
          </div>
        )}
        {current.probabilityOfPrecipitation?.value && (
          <div className="flex justify-between">
            <span className="text-gray-600">Precipitation:</span>
            <span className="font-medium text-gray-900">{current.probabilityOfPrecipitation.value}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
