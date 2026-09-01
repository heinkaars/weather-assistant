import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { enhanceLocationQuery } from './geocode.js';

describe('enhanceLocationQuery', () => {
  test('leaves a query with a state abbreviation untouched', () => {
    assert.equal(enhanceLocationQuery('Springfield IL'), 'Springfield IL');
  });

  test('leaves a query mentioning USA untouched', () => {
    assert.equal(enhanceLocationQuery('Springfield USA'), 'Springfield USA');
  });

  test('leaves a query mentioning United States untouched', () => {
    assert.equal(enhanceLocationQuery('Springfield United States'), 'Springfield United States');
  });

  test('leaves a comma-formatted address untouched', () => {
    assert.equal(enhanceLocationQuery('Springfield, IL'), 'Springfield, IL');
  });

  test('adds US context to a full street address without a state', () => {
    assert.equal(
      enhanceLocationQuery('123 Main Street'),
      '123 Main Street, United States'
    );
  });

  test('adds US context to a short ambiguous one-word query', () => {
    assert.equal(enhanceLocationQuery('Springfield'), 'Springfield, United States');
  });

  test('adds US context to a short ambiguous two-word query', () => {
    assert.equal(enhanceLocationQuery('San Francisco'), 'San Francisco, United States');
  });

  test('leaves a longer multi-word query without context as-is', () => {
    assert.equal(
      enhanceLocationQuery('Golden Gate Park San Francisco'),
      'Golden Gate Park San Francisco'
    );
  });
});
