import express from 'express';
import cors from 'cors';
import type { CorsOptions } from 'cors';
// config must be imported first: it loads .env for every other module.
import { config, validateConfig } from './config.js';
import { geocodeRouter } from './routes/geocode.js';
import { weatherRouter } from './routes/weather.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { apiLimiter, recommendationsLimiter } from './rateLimit.js';

validateConfig();

const app = express();

// Behind Render/Vercel the client IP arrives via X-Forwarded-For. Trust exactly
// one proxy hop so rate limiting keys on the real client rather than the proxy.
// Not enabled in dev, where a spoofed header would be trusted for no benefit.
if (config.isProduction) {
  app.set('trust proxy', 1);
}

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header (curl, health checks, server-to-server)
    // are not browser cross-origin requests, so there is nothing to restrict.
    if (!origin) {
      return callback(null, true);
    }

    const normalized = origin.replace(/\/$/, '');
    if (config.allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }

    // Omit CORS headers rather than throwing: the browser blocks the response
    // and the server still returns a normal status instead of a 500.
    console.warn(`✗ Blocked CORS request from origin: ${origin}`);
    return callback(null, false);
  },
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

// Routes
app.use('/api', apiLimiter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/recommendations', recommendationsLimiter, recommendationsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log(`🚀 FogCast backend running on http://localhost:${config.port}`);
  console.log(`📡 Allowed origins: ${config.allowedOrigins.join(', ') || '(none configured)'}`);
});
