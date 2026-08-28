# FogCast - US Weather Comparison Assistant

[![CI](https://github.com/heinkaars/FogCast/actions/workflows/ci.yml/badge.svg)](https://github.com/heinkaars/FogCast/actions/workflows/ci.yml)

A mobile-first web app that compares weather between any two US locations and provides intelligent AI-powered recommendations.

## Features

- 🌤️ **Compare weather** between any two US locations side-by-side
- 🔍 **Smart location search** with real-time autocomplete suggestions
- 📍 **Free-form location input** - addresses, neighborhoods, landmarks, cities
- 🤖 **AI-powered recommendations** using GPT-4o-mini with location-aware expertise
- 📱 **Mobile-first responsive design** with Tailwind CSS
- ⚡ **Request caching** for optimal performance (10-minute TTL)
- ⌨️ **Keyboard navigation** support for accessibility
- 🎯 **Smart location formatting** for clean display

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Express + TypeScript + Node.js
- **APIs**: 
  - Weather.gov (National Weather Service) - weather data
  - Nominatim (OpenStreetMap) - geocoding & location search
  - OpenAI GPT-4o-mini - AI recommendations

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd FogCast
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
# .env
OPENAI_API_KEY=your-api-key-here
PORT=3001

# Comma-separated origins allowed to call the API.
# Required in production; localhost:5173 is always allowed in dev.
ALLOWED_ORIGINS=
```

**Get your OpenAI API key:** https://platform.openai.com/api-keys

⚠️ **Important:** Set spending limits in your OpenAI account to avoid unexpected charges!

### 3. Install Dependencies

```bash
npm run install:all
```

This installs dependencies for both frontend and backend.

### 4. Start Development Servers

```bash
npm run dev
```

The app will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## API Information

| API | Key Required | Rate Limit | Notes |
|-----|--------------|------------|-------|
| **Weather.gov** | ❌ No | None | US locations only (incl. DC and territories) |
| **Nominatim** | ❌ No | 1 req/sec | Handled by backend with proper User-Agent |
| **OpenAI GPT-4o-mini** | ✅ Yes | Per account | ~$0.15/1M input tokens, ~$0.60/1M output tokens |

## Project Structure

```
FogCast/
├── frontend/                      # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx               # Main application component
│   │   ├── types.ts              # TypeScript type definitions
│   │   ├── api/
│   │   │   └── weather.ts        # API client for backend
│   │   ├── utils/
│   │   │   ├── formatLocation.ts         # Nominatim address → short label
│   │   │   └── formatLocation.test.ts    # Unit tests
│   │   └── components/
│   │       ├── LocationAutocomplete.tsx  # Smart location search with autocomplete
│   │       ├── LocationInput.tsx         # Location input container
│   │       ├── WeatherComparison.tsx     # Side-by-side weather display
│   │       ├── WeatherCard.tsx           # Individual weather cards
│   │       ├── Recommendations.tsx       # AI recommendations display
│   │       ├── LoadingSpinner.tsx        # Loading state UI
│   │       └── ErrorMessage.tsx          # Error handling UI
│   └── package.json
│
├── backend/                       # Express API server
│   ├── src/
│   │   ├── server.ts             # Main server entry point
│   │   ├── config.ts             # Env loading + startup validation
│   │   ├── cache.ts              # Request caching (10 min TTL)
│   │   ├── rateLimit.ts          # Per-IP rate limiters
│   │   └── routes/
│   │       ├── geocode.ts        # Nominatim API proxy with autocomplete
│   │       ├── weather.ts        # Weather.gov API proxy
│   │       └── recommendations.ts # OpenAI integration for AI advice
│   └── package.json
│
├── .github/workflows/ci.yml      # Typecheck + test + build on every PR
├── .env                          # Environment variables (create this)
├── .gitignore                    # Git ignore rules
├── package.json                  # Root package with dev scripts
└── README.md                     # This file
```

## Usage Examples

### Location Input
The autocomplete supports various location types:

- **Neighborhoods:** "Mission District", "Marina", "SOMA"
- **Landmarks:** "Golden Gate Park", "Coit Tower", "Ferry Building"
- **Beaches:** "Ocean Beach", "Baker Beach", "Aquatic Park"
- **Cities:** "Oakland", "Berkeley", "San Francisco", "Palo Alto"
- **Addresses:** "1 Market St, SF", "2055 Center St, Berkeley"

### Keyboard Navigation
- Type 2+ characters to see suggestions
- Use `↑` `↓` arrow keys to navigate suggestions
- Press `Enter` to select
- Press `Esc` to close suggestions

## Development

### Available Commands

```bash
# Install all dependencies (root + frontend + backend)
npm run install:all

# Run both frontend and backend concurrently
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend

# Build for production
cd frontend && npm run build
cd backend && npm run build

# Run the test suite
npm test

# Typecheck both workspaces
npm run typecheck
```

These are the same checks CI runs on every pull request.

### Key Features Implemented

✅ Real-time location autocomplete with debouncing (500ms)  
✅ Smart location formatting (removes redundant info)  
✅ Keyboard navigation (arrow keys, enter, escape)  
✅ Click-outside to close suggestions  
✅ Loading states for better UX  
✅ Request caching (10-minute TTL)  
✅ Error handling with user-friendly messages  
✅ Mobile-first responsive design  
✅ AI-powered location comparisons  

## Troubleshooting

### "OpenAI API key not configured"
- Ensure `.env` file exists in the root directory
- Verify `OPENAI_API_KEY` is set correctly
- Restart the backend server after adding the key

### "Location not found"
- Try being more specific (e.g., add the city or state, like "Portland, OR")
- Use well-known landmarks or neighborhoods
- Check spelling

### CORS errors
- Ensure both frontend and backend are running
- Frontend should be on http://localhost:5173
- Backend should be on http://localhost:3001
- In development, `http://localhost:5173` is allowed automatically
- In production, the backend only accepts origins listed in `ALLOWED_ORIGINS` — set it to your deployed frontend URL (see [DEPLOY.md](./DEPLOY.md))

### "Too many requests" (HTTP 429)
The API is rate limited per IP: 300 requests / 15 minutes overall, and 20 / hour for AI recommendations (each call costs OpenAI credits). Adjust the limits in [`backend/src/rateLimit.ts`](./backend/src/rateLimit.ts) if you need different thresholds.

## Contributing

See [SETUP.md](./SETUP.md) for detailed setup instructions and development guidelines.

## License

MIT
