import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// dotenv is loaded here, in the module every other module depends on, so that
// ES module evaluation order can never read process.env before it is populated.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

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
  const warnings: string[] = [];

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
    console.error('✗ Invalid configuration:');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  warnings.push(...errors);
  console.warn('⚠️  Configuration warnings (non-fatal in development):');
  for (const warning of warnings) {
    console.warn(`  - ${warning}`);
  }
}
