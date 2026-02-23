# Deploy FogCast to Vercel (Frontend) + Render (Backend)

The app has two parts: **frontend** (Vercel) and **backend API** (Render). Deploy the backend first so you have the API URL for the frontend.

---

## Step 1: Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New** → **Web Service**.
3. Connect your repository: **heinkaars/FogCast** (or your repo name).
4. Configure:
   - **Name:** `fogcast-api` (or any name).
   - **Root Directory:** leave empty (we’ll set build/start from `backend`).
   - **Environment:** Node.
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
5. Under **Environment**, add:
   - **Key:** `OPENAI_API_KEY`  
   - **Value:** your OpenAI API key  
   (Optionally set `NODE_ENV` = `production`.)
6. Click **Create Web Service** and wait for the first deploy.
7. Copy your service URL, e.g. `https://fogcast-api.onrender.com` (no trailing slash). You’ll use this as `VITE_API_URL` in Step 2.

---

## Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** → **Project** and import your **FogCast** repository.
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
- **Backend:** Uses `cors()` so requests from your Vercel domain are allowed.
- If you change the backend URL, update `VITE_API_URL` on Vercel and redeploy the frontend.

---

## Optional: Custom Domain

- **Vercel:** Project → Settings → Domains → add your domain.
- **Render:** Service → Settings → Custom Domain (if you want a custom URL for the API).
