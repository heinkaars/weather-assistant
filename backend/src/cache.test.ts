import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateCacheKey } from './cache.js';

describe('generateCacheKey', () => {
  test('joins prefix and parts with colons', () => {
    assert.equal(generateCacheKey('geocode', 'Springfield, IL'), 'geocode:springfield, il');
  });

  test('lowercases the result', () => {
    assert.equal(generateCacheKey('WEATHER', 'LAT', 'LON'), 'weather:lat:lon');
  });

  test('joins multiple parts', () => {
    assert.equal(generateCacheKey('weather', '37.77', '-122.42'), 'weather:37.77:-122.42');
  });
});
