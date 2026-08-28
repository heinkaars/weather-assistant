import { describe, it, expect } from 'vitest';
import { formatLocation } from './formatLocation';

describe('formatLocation', () => {
  describe('street addresses', () => {
    it('formats a house number, street, city and state', () => {
      expect(
        formatLocation('1, Market Street, South Beach, San Francisco, California, 94105, United States')
      ).toBe('1 Market Street, San Francisco, CA');
    });

    it('converts a house-number range to a dash', () => {
      expect(
        formatLocation('646;648, Bush Street, Chinatown, San Francisco, California, 94108, United States')
      ).toBe('646-648 Bush Street, San Francisco, CA');
    });

    it('skips county components when picking the city', () => {
      expect(
        formatLocation('2055, Center Street, Berkeley, Alameda County, California, 94704, United States')
      ).toBe('2055 Center Street, Berkeley, CA');
    });

    it('skips bare numbers between the street and the state', () => {
      expect(
        formatLocation('500, Terry Francois Boulevard, 94158, Mission Bay, San Francisco, California, United States')
      ).toBe('500 Terry Francois Boulevard, San Francisco, CA');
    });
  });

  describe('named places', () => {
    it('formats a landmark with its city, not its neighborhood', () => {
      expect(
        formatLocation('Golden Gate Park, Richmond District, San Francisco, California, United States')
      ).toBe('Golden Gate Park, San Francisco, CA');
    });

    it('formats a city that is its own first component', () => {
      expect(formatLocation('Oakland, Alameda County, California, United States')).toBe(
        'Oakland, CA'
      );
    });

    it('does not repeat the place name as the city', () => {
      expect(formatLocation('Berkeley, Berkeley, California, United States')).toBe('Berkeley, CA');
    });
  });

  describe('state, district and territory recognition', () => {
    it('recognizes multi-word state names', () => {
      expect(formatLocation('Albany, Albany County, New York, United States')).toBe('Albany, NY');
    });

    it('recognizes the District of Columbia', () => {
      expect(formatLocation('Washington, District of Columbia, 20500, United States')).toBe(
        'Washington, DC'
      );
    });

    it('recognizes Puerto Rico', () => {
      expect(formatLocation('San Juan, Puerto Rico, 00901, United States')).toBe('San Juan, PR');
    });
  });

  describe('fallbacks', () => {
    it('returns the input unchanged when there are no comma-separated parts', () => {
      expect(formatLocation('Yosemite')).toBe('Yosemite');
    });

    it('returns the two most specific parts when no state is recognized', () => {
      expect(formatLocation('Some Place, Some Region, Canada')).toBe('Some Place, Some Region');
    });

    it('omits the city when none can be identified', () => {
      expect(formatLocation('Sacramento, California, United States')).toBe('Sacramento, CA');
    });

    it('handles an empty string', () => {
      expect(formatLocation('')).toBe('');
    });
  });

  describe('regression guards', () => {
    // A plain object literal lookup would treat these as a state match, because
    // `stateAbbr["constructor"]` inherits a truthy value from Object.prototype.
    it('does not treat Object.prototype members as state names', () => {
      expect(formatLocation('constructor, toString, valueOf')).toBe('constructor, toString');
    });

    it('does not pick a component after the state as the city', () => {
      expect(formatLocation('Coit Tower, Telegraph Hill, San Francisco, California, United States')).toBe(
        'Coit Tower, San Francisco, CA'
      );
    });

    // Scanning forward would match "Washington" (the state) at index 0.
    it('resolves a city sharing a state name using the trailing state', () => {
      expect(formatLocation('Washington, District of Columbia, 20500, United States')).toBe(
        'Washington, DC'
      );
      expect(formatLocation('New York, New York, United States')).toBe('New York, NY');
    });
  });
});
