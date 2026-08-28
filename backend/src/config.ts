// env must be imported first: it loads .env before anything reads process.env.
import './env.js';
import { logger } from './logger.js';

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

if (!isProduction) {
  allowedOrigins.push(...DEV_ORIGINS);
}

export const config = {
  port: process.env.PORT || 3001,
  isProduction,
  openaiApiKey: process.env.OPENAI_API_KEY?.trim() || '',
  allowedOrigins,
} as const;

/**
 * Validates configuration at boot rather than on first request.
 *
 * In production a missing key is a deploy-time mistake, so we exit and let the
 * platform surface a failed deploy. In development we only warn, so the weather
 * comparison features remain workable without an OpenAI key.
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.openaiApiKey) {
    errors.push(
      'OPENAI_API_KEY is not set — the AI recommendations endpoint cannot work.'
    );
  }

  if (config.allowedOrigins.length === 0) {
    errors.push(
      'ALLOWED_ORIGINS is not set — every browser request will be rejected by CORS. ' +
        'Set it to your frontend URL (e.g. https://your-app.vercel.app).'
    );
  }

  if (errors.length === 0) {
    return;
  }

  if (config.isProduction) {
    logger.fatal({ errors }, 'Invalid configuration');
    process.exit(1);
  }

  logger.warn({ warnings: errors }, 'Configuration warnings (non-fatal in development)');
}
