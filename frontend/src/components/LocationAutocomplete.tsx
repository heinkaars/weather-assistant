import { useState, useEffect, useRef } from 'react';

interface LocationSuggestion {
  location: string;
  lat: number;
  lon: number;
}

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
  const [justSelected, setJustSelected] = useState(false); // Prevent search after selection
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

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

  // Fetch suggestions with debounce
  useEffect(() => {
    // Don't search if we just selected a suggestion
    if (justSelected) {
      setJustSelected(false);
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
        const response = await fetch(
          `/api/geocode?location=${encodeURIComponent(inputValue)}&autocomplete=true`
        );
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
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
    setJustSelected(true); // Prevent immediate re-search
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

  // Format location for display - show number, street, city, state
  const formatLocation = (loc: string) => {
    const parts = loc.split(', ');
    
    if (parts.length < 2) {
      return loc;
    }
    
    // Nominatim format varies:
    // [Number], [Street], [Neighborhood], [City], [County], [State], [ZIP], [Country]
    // OR: [Street], [Neighborhood], [City], [County], [State], [ZIP], [Country]
    
    // Map of state names to abbreviations
    const stateAbbr: { [key: string]: string } = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    
    // Find state in the address
    const stateIndex = parts.findIndex(p => stateAbbr[p]);
    if (stateIndex === -1) {
      // No recognized state, return first 2 parts
      return parts.slice(0, 2).join(', ');
    }
    
    const stateName = parts[stateIndex];
    const stateCode = stateAbbr[stateName];
    
    // Build the address components
    let addressPart = '';
    let city = '';
    
    // Check if first part is a number/address range (like "646;648" or "646")
    const firstPart = parts[0];
    const hasNumber = /^\d/.test(firstPart);
    
    if (hasNumber && parts.length > 1) {
      // First part is number, second part is likely street name
      const number = firstPart.replace(/;/g, '-'); // "646;648" -> "646-648"
      const street = parts[1];
      
      // Check if street looks like a street name (contains keywords or is mostly letters)
      const streetKeywords = /\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|way|lane|ln|place|pl|court|ct|circle|cir)\b/i;
      if (streetKeywords.test(street) || !/^\d+$/.test(street)) {
        addressPart = `${number} ${street}`;
        
        // Find city (skip neighborhoods, counties)
        for (let i = 2; i < stateIndex; i++) {
          const part = parts[i];
          if (!part.includes('County') && !/^\d+$/.test(part)) {
            city = part;
            break;
          }
        }
      } else {
        // Second part isn't a street name, first part is the place
        addressPart = number;
        // Find city
        for (let i = 1; i < stateIndex; i++) {
          const part = parts[i];
          if (!part.includes('County') && !/^\d+$/.test(part)) {
            city = part;
            break;
          }
        }
      }
    } else {
      // No number in first part, it's a place name
      addressPart = firstPart;
      
      // Find city
      for (let i = 1; i < stateIndex; i++) {
        const part = parts[i];
        if (!part.includes('County') && !/^\d+$/.test(part)) {
          city = part;
          break;
        }
      }
    }
    
    // Format: "Number Street, City, ST" or "Place, City, ST"
    if (city && city !== addressPart) {
      return `${addressPart}, ${city}, ${stateCode}`;
    }
    
    // Fallback: Address, ST
    return `${addressPart}, ${stateCode}`;
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
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
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
