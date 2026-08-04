# 🚀 Deployment Guide — Civic Reporting App
## GitHub + Render (Free Hosting)

---

## Overview

| Service | Platform | URL |
|---------|----------|-----|
| Backend API | Render (Web Service) | https://civic-reporting-api.onrender.com |
| Frontend Admin | Render (Static Site) | https://civic-reporting-app.onrender.com |
| Database | Supabase (Free PostgreSQL) | Already configured |
| CI/CD | GitHub Actions | Auto-deploy on push to main |

---

## STEP 1 — Push code to GitHub

### 1a. Create a GitHub repository

1. Go to **https://github.com** and sign in
2. Click the **+** icon → **"New repository"**
3. Name it: `civic-reporting-app`
4. Set to **Public** or **Private**
5. Do NOT initialize with README (we have our own)
6. Click **"Create repository"**

### 1b. Push from your computer

Open **cmd** in your project folder and run these commands **one by one**:

```cmd
cd "c:\Users\USER\Desktop\New folder\CIVIC REPORTING APP"
```

```cmd
git init
```

```cmd
git add .
```

```cmd
git commit -m "Initial commit: Civic Reporting App"
```

```cmd
git branch -M main
```

```cmd
git remote add origin https://github.com/YOUR-USERNAME/civic-reporting-app.git
```

Replace `YOUR-USERNAME` with your actual GitHub username.

```cmd
git push -u origin main
```

It will ask for your GitHub username and password (use a Personal Access Token as password — see below).

### 1c. Create a GitHub Personal Access Token (if needed)

1. Go to **https://github.com/settings/tokens**
2. Click **"Generate new token (classic)"**
3. Name it: `civic-reporting-deploy`
4. Check: `repo` (full control)
5. Click **"Generate token"**
6. Copy the token — use it as your password when pushing

---

## STEP 2 — Set up Supabase database (already done if you followed setup)

Your Supabase database is already configured. Just note down:
- Host: `aws-0-eu-west-1.pooler.supabase.com`
- Port: `6543`
- Username: `postgres.yckasecazpyfmihpjsro`
- Password: `Civic@Report2024!`
- Database: `postgres`

---

## STEP 3 — Deploy Backend to Render

1. Go to **https://render.com** and sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Connect your **GitHub account**
4. Select your `civic-reporting-app` repository
5. Fill in these settings:

| Setting | Value |
|---------|-------|
| Name | `civic-reporting-api` |
| Region | Oregon (US West) |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `node dist/main` |
| Plan | Free |

6. Click **"Advanced"** → **"Add Environment Variable"** and add ALL of these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DB_HOST` | `aws-0-eu-west-1.pooler.supabase.com` |
| `DB_PORT` | `6543` |
| `DB_USERNAME` | `postgres.yckasecazpyfmihpjsro` |
| `DB_PASSWORD` | `Civic@Report2024!` |
| `DB_NAME` | `postgres` |
| `JWT_SECRET` | (click "Generate" — Render will create a random one) |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_SECRET` | (click "Generate" again) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | `https://civic-reporting-app.onrender.com` |

7. Click **"Create Web Service"**
8. Wait 3–5 minutes for the first deploy
9. Your API will be live at: `https://civic-reporting-api.onrender.com`
10. Test it: open `https://civic-reporting-api.onrender.com/api/docs`

---

## STEP 4 — Deploy Frontend to Render

1. Click **"New +"** → **"Static Site"**
2. Select the same `civic-reporting-app` repository
3. Fill in:

| Setting | Value |
|---------|-------|
| Name | `civic-reporting-app` |
| Branch | `main` |
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Plan | Free |

4. Add Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://civic-reporting-api.onrender.com/api/v1` |
| `VITE_MAPBOX_TOKEN` | your Mapbox token (or leave empty) |

5. Click **"Create Static Site"**
6. Wait 2–3 minutes
7. Your app will be at: `https://civic-reporting-app.onrender.com`

---

## STEP 5 — Set up auto-deploy (GitHub Actions)

### Get your Render Deploy Hooks

1. In Render → go to your **backend service** → Settings → **Deploy Hook**
2. Copy the URL
3. In Render → go to your **frontend service** → Settings → **Deploy Hook**  
4. Copy that URL too

### Add secrets to GitHub

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"** and add:

| Name | Value |
|------|-------|
| `RENDER_BACKEND_DEPLOY_HOOK` | The backend deploy hook URL from Render |
| `RENDER_FRONTEND_DEPLOY_HOOK` | The frontend deploy hook URL from Render |
| `VITE_MAPBOX_TOKEN` | Your Mapbox token |

Now every time you push to `main`, GitHub Actions will:
1. ✅ Build and test the backend
2. ✅ Build and test the frontend
3. 🚀 Trigger Render to deploy both

---

## STEP 6 — Verify deployment

Open your browser and visit:

```
https://civic-reporting-app.onrender.com
```

Login with:
- **Admin:** `admin@civicreport.ng` / `Admin@1234`
- **Citizen:** `citizen@demo.ng` / `Admin@1234`

Or register a new account.

---

## Updating the app after deployment

Every time you make changes:

```cmd
cd "c:\Users\USER\Desktop\New folder\CIVIC REPORTING APP"
git add .
git commit -m "describe your change here"
git push
```

GitHub Actions automatically builds and deploys to Render.

---

## Free tier limitations (Render)

| Limitation | Impact |
|-----------|--------|
| Backend sleeps after 15 min inactivity | First request after sleep takes ~30 seconds |
| 750 free hours/month per service | Enough for 2 services running 24/7 |
| No custom domain on free plan | You get a `.onrender.com` subdomain |

**To avoid sleep on free tier:** Use a service like [UptimeRobot](https://uptimerobot.com) (free) to ping your API every 10 minutes.

---

## Environment Variables Summary

### Backend (set in Render)
```
NODE_ENV=production
PORT=3000
DB_HOST=aws-0-eu-west-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.yckasecazpyfmihpjsro
DB_PASSWORD=Civic@Report2024!
DB_NAME=postgres
JWT_SECRET=<auto-generated>
JWT_REFRESH_SECRET=<auto-generated>
CORS_ORIGIN=https://civic-reporting-app.onrender.com
```

### Frontend (set in Render)
```
VITE_API_URL=https://civic-reporting-api.onrender.com/api/v1
VITE_MAPBOX_TOKEN=<your token>
```
