# Deploy FogCast to Vercel (Frontend) + Render (Backend)

The app has two parts: **frontend** (Vercel) and **backend API** (Render). Deploy the backend first so you have the API URL for the frontend.

---

## Step 1: Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New** → **Web Service**.
3. Connect your repository: **heinkaars/weather-assistant** (or your repo name).
4. Configure:
   - **Name:** `fogcast-api` (or any name).
   - **Root Directory:** leave empty (we’ll set build/start from `backend`).
   - **Environment:** Node.
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
5. Under **Environment**, add:
   - **Key:** `OPENAI_API_KEY`  
   - **Value:** your OpenAI API key  
   - **Key:** `NODE_ENV` → **Value:** `production`  
     (Required so the app trusts Render's proxy and rate-limits per real client IP.)
   - **Key:** `ALLOWED_ORIGINS` → **Value:** your Vercel frontend URL, e.g. `https://fogcast.vercel.app`  
     (Comma-separate multiple origins, no trailing slash. You will not have this URL until Step 2 — deploy the frontend first, then come back and set it.)
6. Click **Create Web Service** and wait for the first deploy.
7. Copy your service URL, e.g. `https://fogcast-api.onrender.com` (no trailing slash). You’ll use this as `VITE_API_URL` in Step 2.

---

## Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** → **Project** and import your **weather-assistant** repository.
3. Configure:
   - **Framework Preset:** Other (we use a custom build).
   - **Root Directory:** leave as `.` (repo root).
   - **Build Command:** (optional; already in `vercel.json`)  
     `cd frontend && npm install && npm run build`
   - **Output Directory:** (optional; already in `vercel.json`)  
     `frontend/dist`
4. Under **Environment Variables**, add:
   - **Name:** `VITE_API_URL`  
   - **Value:** your Render backend URL from Step 1, e.g. `https://fogcast-api.onrender.com`  
   - **Environment:** Production (and Preview if you want).
5. Click **Deploy** and wait for the build to finish.
6. Your app will be live at the Vercel URL (e.g. `https://fogcast.vercel.app`).

---

## After Deployment

- **Frontend:** Uses `VITE_API_URL` at build time, so all API calls go to your Render backend.
- **Backend:** Only accepts browser requests from the origins listed in `ALLOWED_ORIGINS`. If the frontend shows CORS errors, confirm that variable exactly matches your Vercel domain (including `https://`, no trailing slash) and redeploy the backend.
- **Rate limits:** 300 requests / 15 min per IP across the API, and 20 / hour per IP on the OpenAI-backed `/api/recommendations` route. Clients receive HTTP 429 with a JSON message when exceeded.
- **Startup validation:** In production the backend exits immediately if `OPENAI_API_KEY` or `ALLOWED_ORIGINS` is missing, so a misconfiguration shows up as a failed deploy rather than a broken feature. In development it only warns.

## Known limitations

- **Caching and rate limiting are per-instance and in-memory.** Both the 10-minute weather/geocode cache and the rate-limit counters live in the process, so they reset on every restart and are not shared across instances. On Render's free tier the service spins down when idle, which means a cold start serves an empty cache and resets rate-limit windows. This is fine for a single-instance deployment; if you scale to multiple instances or need limits that survive restarts, back both with Redis (`rate-limit-redis` for the limiter).
- **Weather.gov covers US locations only**, including DC and the territories. Non-US coordinates return a 404 from the weather endpoint.
- If you change the backend URL, update `VITE_API_URL` on Vercel and redeploy the frontend.

---

## Optional: Custom Domain

- **Vercel:** Project → Settings → Domains → add your domain.
- **Render:** Service → Settings → Custom Domain (if you want a custom URL for the API).
