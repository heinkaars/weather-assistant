import { useState } from 'react';
import LocationInput from './components/LocationInput';
import WeatherComparison from './components/WeatherComparison';
import Recommendations from './components/Recommendations';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { fetchWeatherComparison } from './api/weather';
import type { WeatherComparisonData } from './types';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<WeatherComparisonData | null>(null);

  const handleCompare = async (location1: string, location2: string) => {
    setLoading(true);
    setError(null);
    setComparisonData(null);

    try {
      const data = await fetchWeatherComparison(location1, location2);
      setComparisonData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🌤️</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FogCast</h1>
              <p className="text-sm text-gray-600">US Weather Comparison Assistant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <LocationInput onCompare={handleCompare} loading={loading} />

        {loading && (
          <div className="mt-8">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="mt-8">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {comparisonData && !loading && (
          <div className="mt-8 space-y-6">
            <WeatherComparison data={comparisonData} />
            <Recommendations 
              location1={comparisonData.location1.name}
              location2={comparisonData.location2.name}
              weather1={comparisonData.location1.weather}
              weather2={comparisonData.location2.weather}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-xs text-center text-gray-500">
            Data from Weather.gov (NWS) • Geocoding by OpenStreetMap • AI by OpenAI
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
