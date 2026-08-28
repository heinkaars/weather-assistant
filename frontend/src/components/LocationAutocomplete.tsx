import { useState, useEffect, useRef } from 'react';
import { fetchLocationSuggestions } from '../api/weather';
import type { LocationSuggestion } from '../types';
import { formatLocation } from '../utils/formatLocation';

interface LocationAutocompleteProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onSelect: (location: string, lat: number, lon: number) => void;
  disabled?: boolean;
}

export default function LocationAutocomplete({
  id,
  label,
  placeholder,
  value,
  onSelect,
  disabled = false,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // Tracks the last value we committed (via selection or an external `value`
  // change like a swap), so the fetch effect can tell "user is typing" apart
  // from "value changed programmatically" without a one-shot flag.
  const lastCommittedValue = useRef(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync from an external value change (e.g. the parent swapping locations)
  // without treating it as user input that should trigger a new search.
  useEffect(() => {
    if (value !== lastCommittedValue.current) {
      lastCommittedValue.current = value;
      setInputValue(value);
    }
  }, [value]);

  // Fetch suggestions with debounce
  useEffect(() => {
    // Don't search again for a value we already committed (selection, or an
    // external sync above) - only for text the user actually typed.
    if (inputValue === lastCommittedValue.current) {
      return;
    }

    if (inputValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchLocationSuggestions(inputValue);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    lastCommittedValue.current = suggestion.location; // Prevent immediate re-search
    setInputValue(suggestion.location);
    onSelect(suggestion.location, suggestion.lat, suggestion.lon);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input-field"
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={selectedIndex >= 0 ? optionId(selectedIndex) : undefined}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {showSuggestions && suggestions.length > 0
          ? `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'} available`
          : showSuggestions && inputValue.length >= 2 && suggestions.length === 0
            ? 'No suggestions available'
            : ''}
      </span>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              id={optionId(index)}
              role="option"
              aria-selected={index === selectedIndex}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg mt-0.5">📍</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate" title={suggestion.location}>
                    {formatLocation(suggestion.location)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3">
          <p className="text-sm text-gray-500">
            No US locations found. Try being more specific or include a city/state.
          </p>
        </div>
      )}
    </div>
  );
}
