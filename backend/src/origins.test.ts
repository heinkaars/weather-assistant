import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createOriginMatcher } from './origins.js';

const PREVIEWS = 'https://weather-assistant-*-heins-projects-551259a7.vercel.app';

describe('createOriginMatcher', () => {
  const isAllowed = createOriginMatcher([
    'https://weather-assistant-nine.vercel.app',
    PREVIEWS,
  ]);

  test('allows an exact origin', () => {
    assert.equal(isAllowed('https://weather-assistant-nine.vercel.app'), true);
  });

  test('ignores a trailing slash and case', () => {
    assert.equal(isAllowed('https://Weather-Assistant-Nine.vercel.app/'), true);
  });

  test('allows hash-based preview URLs', () => {
    assert.equal(isAllowed('https://weather-assistant-h7f0g5m0j-heins-projects-551259a7.vercel.app'), true);
  });

  test('allows branch preview URLs', () => {
    assert.equal(
      isAllowed('https://weather-assistant-git-allow-vercel-previews-heins-projects-551259a7.vercel.app'),
      true
    );
  });

  test('rejects another Vercel team', () => {
    assert.equal(isAllowed('https://weather-assistant-abc123-someone-else.vercel.app'), false);
  });

  test('rejects a wildcard that would need to span a dot', () => {
    assert.equal(isAllowed('https://weather-assistant-x.evil.com-heins-projects-551259a7.vercel.app'), false);
  });

  test('rejects the pattern with extra text after the host', () => {
    assert.equal(isAllowed(`${PREVIEWS.replace('*', 'abc')}.evil.com`), false);
    assert.equal(isAllowed(`${PREVIEWS.replace('*', 'abc')}:8080`), false);
  });

  test('rejects http for an https entry', () => {
    assert.equal(isAllowed('http://weather-assistant-nine.vercel.app'), false);
  });

  test('treats regex characters in entries literally', () => {
    const matches = createOriginMatcher(['https://a.example']);
    assert.equal(matches('https://aXexample'), false);
  });

  test('allows nothing when the list is empty', () => {
    assert.equal(createOriginMatcher([])('https://weather-assistant-nine.vercel.app'), false);
  });
});
