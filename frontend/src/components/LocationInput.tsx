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

interface RecentSearch {
  location1: SelectedLocation;
  location2: SelectedLocation;
}

const RECENT_SEARCHES_KEY = 'fogcast-recent-searches';
const MAX_RECENT_SEARCHES = 5;

function loadRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: RecentSearch[]) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // localStorage may be unavailable (private browsing, quota) - not fatal
  }
}

export default function LocationInput({ onCompare, loading }: LocationInputProps) {
  const [location1, setLocation1] = useState<SelectedLocation | null>(null);
  const [location2, setLocation2] = useState<SelectedLocation | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(loadRecentSearches);

  const addRecentSearch = (loc1: SelectedLocation, loc2: SelectedLocation) => {
    setRecentSearches((prev) => {
      const isSamePair = (s: RecentSearch) =>
        s.location1.name === loc1.name && s.location2.name === loc2.name;
      const next = [{ location1: loc1, location2: loc2 }, ...prev.filter((s) => !isSamePair(s))].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      saveRecentSearches(next);
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (location1 && location2) {
      onCompare(location1, location2);
      addRecentSearch(location1, location2);
    }
  };

  const handleLocation1Select = (name: string, lat: number, lon: number) => {
    setLocation1({ name, lat, lon });
  };

  const handleLocation2Select = (name: string, lat: number, lon: number) => {
    setLocation2({ name, lat, lon });
  };

  const handleSwap = () => {
    setLocation1(location2);
    setLocation2(location1);
  };

  const handleRecentSearchClick = (search: RecentSearch) => {
    setLocation1(search.location1);
    setLocation2(search.location2);
    onCompare(search.location1, search.location2);
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

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwap}
            disabled={loading || (!location1 && !location2)}
            aria-label="Swap locations"
            className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <span aria-hidden="true">⇅</span>
          </button>
        </div>

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

      {recentSearches.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Recent searches</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleRecentSearchClick(search)}
                disabled={loading}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors disabled:opacity-50"
              >
                {search.location1.name} → {search.location2.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>💡 Pro tip:</strong> Start typing any US location - neighborhoods,
          landmarks, parks, cities, or exact addresses. Select from the suggestions that appear.
        </p>
      </div>
    </div>
  );
}
