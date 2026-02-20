import type { WeatherComparisonData } from '../types';
import WeatherCard from './WeatherCard';

interface WeatherComparisonProps {
  data: WeatherComparisonData;
}

export default function WeatherComparison({ data }: WeatherComparisonProps) {
  const { location1, location2 } = data;

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Weather Comparison</h2>
        
        {/* Weather Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <WeatherCard
            title="Current Location"
            location={location1.name}
            weather={location1.weather}
          />
          <WeatherCard
            title="Destination"
            location={location2.name}
            weather={location2.weather}
          />
        </div>
      </div>
    </div>
  );
}
