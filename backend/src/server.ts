import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { geocodeRouter } from './routes/geocode.js';
import { weatherRouter } from './routes/weather.js';
import { recommendationsRouter } from './routes/recommendations.js';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

// Load environment variables
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/geocode', geocodeRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/recommendations', recommendationsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 FogCast backend running on http://localhost:${PORT}`);
  console.log(`📡 Frontend should connect to this server`);
});
