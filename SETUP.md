# FogCast Setup Guide

## Quick Start

### 1. Create Environment File

Create a `.env` file in the root directory:

```bash
touch .env
```

Add your OpenAI API key to `.env`:

```env
# OpenAI API Key (required)
OPENAI_API_KEY=sk-your-api-key-here

# Server Port (optional)
PORT=3001
```

**Get your OpenAI API key:** https://platform.openai.com/api-keys

⚠️ **Important:** Set spending limits in your OpenAI account to avoid unexpected charges!

### 2. Install Dependencies

```bash
npm run install:all
```

This will install dependencies for:
- Root (concurrently for running both servers)
- Backend (Express, OpenAI, caching)
- Frontend (React, Vite, Tailwind)

### 3. Start Development Servers

```bash
npm run dev
```

This will start both servers concurrently:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

## Project Structure

```
FogCast/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── server.ts       # Main server file
│   │   ├── cache.ts        # Request caching (10 min TTL)
│   │   └── routes/
│   │       ├── geocode.ts  # Nominatim API proxy
│   │       ├── weather.ts  # Weather.gov API proxy
│   │       └── recommendations.ts  # OpenAI integration
│   └── package.json
│
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── App.tsx        # Main app component
│   │   ├── types.ts       # TypeScript types
│   │   ├── api/
│   │   │   └── weather.ts # API client
│   │   └── components/
│   │       ├── LocationInput.tsx
│   │       ├── WeatherComparison.tsx
│   │       ├── WeatherCard.tsx
│   │       ├── Recommendations.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorMessage.tsx
│   └── package.json
│
├── .env                    # Environment variables (YOU CREATE THIS)
├── .env.example           # Template
└── README.md
```

## Features Implemented

✅ **Geocoding** - Free-form location input using Nominatim (OpenStreetMap)
✅ **Weather Data** - Hourly forecasts from Weather.gov (NWS)
✅ **AI Recommendations** - Intelligent advice from GPT-4o-mini
✅ **Request Caching** - 10-minute cache for API responses
✅ **Mobile-First Design** - Responsive UI with Tailwind CSS
✅ **Error Handling** - User-friendly error messages
✅ **Loading States** - Visual feedback during API calls

## API Details

### Weather.gov (National Weather Service)
- ✅ No API key required
- ✅ No rate limits
- ✅ US locations only (perfect for Bay Area)
- 📍 Requires: coordinates → grid point → forecast

### Nominatim (OpenStreetMap)
- ✅ No API key required
- ⚠️ Rate limit: 1 request/second (handled by backend)
- ⚠️ Requires User-Agent header (included)

### OpenAI GPT-4o-mini
- ⚠️ API key required
- 💰 Cost: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- 🎯 Model: `gpt-4o-mini` (fast and cost-effective)

## Usage Tips

1. **Location Examples:**
   - Neighborhoods: "Mission District, SF", "Marina, SF"
   - Landmarks: "Golden Gate Park", "Coit Tower"
   - Beaches: "Ocean Beach, SF", "Baker Beach"
   - Cities: "Oakland", "Berkeley", "San Francisco"

2. **Best for Bay Area:**
   - The app is optimized for Bay Area microclimates
   - AI knows about fog patterns, temperature variations, etc.
   - Try comparing coastal vs inland locations!

3. **Caching:**
   - Requests are cached for 10 minutes
   - Look for "📦 Cached data" indicator
   - Same location won't hit APIs twice within 10 min

## Troubleshooting

### "OpenAI API key not configured"
- Make sure you created `.env` in the root directory
- Verify `OPENAI_API_KEY` is set correctly
- Restart the backend server after adding the key

### "Location not found"
- Try being more specific: add "Bay Area, CA" or "San Francisco"
- Use well-known landmarks or neighborhoods
- Check spelling

### "Location not supported" (Weather.gov)
- Weather.gov only covers US locations
- Make sure location is within the United States
- Bay Area locations should always work

### CORS errors
- Make sure both servers are running
- Frontend should proxy API requests through Vite
- Check that backend is running on port 3001

## Development Commands

```bash
# Install all dependencies
npm run install:all

# Run both frontend + backend
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend

# Build for production
cd frontend && npm run build
cd backend && npm run build
```

## Next Steps

1. **Add your OpenAI API key** to `.env`
2. **Install dependencies** with `npm run install:all`
3. **Start the servers** with `npm run dev`
4. **Open http://localhost:5173** in your browser
5. **Compare two Bay Area locations!**

Enjoy exploring Bay Area microclimates! 🌁☀️🌤️
