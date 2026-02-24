import { useState, FormEvent } from 'react';
import LocationAutocomplete from './LocationAutocomplete';
import type { LocationWithCoords } from '../types';

interface LocationInputProps {
  onCompare: (location1: LocationWithCoords, location2: LocationWithCoords) => void;
  loading: boolean;
}

interface SelectedLocation {
  name: string;
  lat: number;
  lon: number;
}

export default function LocationInput({ onCompare, loading }: LocationInputProps) {
  const [location1, setLocation1] = useState<SelectedLocation | null>(null);
  const [location2, setLocation2] = useState<SelectedLocation | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (location1 && location2) {
      onCompare(location1, location2);
    }
  };

  const handleLocation1Select = (name: string, lat: number, lon: number) => {
    setLocation1({ name, lat, lon });
  };

  const handleLocation2Select = (name: string, lat: number, lon: number) => {
    setLocation2({ name, lat, lon });
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Compare Two Locations</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <LocationAutocomplete
          id="location1"
          label="Current Location"
          placeholder="e.g., Mission District, SF"
          value={location1?.name || ''}
          onSelect={handleLocation1Select}
          disabled={loading}
        />

        <LocationAutocomplete
          id="location2"
          label="Destination"
          placeholder="e.g., Ocean Beach, SF"
          value={location2?.name || ''}
          onSelect={handleLocation2Select}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={!location1 || !location2 || loading}
          className="btn-primary w-full"
        >
          {loading ? 'Comparing...' : 'Compare Weather'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>💡 Pro tip:</strong> Start typing any US location - neighborhoods, 
          landmarks, parks, cities, or exact addresses. Select from the suggestions that appear.
        </p>
      </div>
    </div>
  );
}
