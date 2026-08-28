import rateLimit from 'express-rate-limit';

// General limiter for all API routes. Generous enough for normal browsing
// (autocomplete fires one request per debounced keystroke) but caps scraping.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP. Please try again in a few minutes.',
  },
});

// Strict limiter for the OpenAI-backed route: every call costs money, so this
// is the endpoint worth protecting most aggressively.
export const recommendationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Recommendation limit reached',
    message: 'You have reached the hourly limit for AI recommendations. Please try again later.',
  },
});
