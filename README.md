# 🏛️ Civic Reporting App

A modern, full-stack platform that empowers citizens to report community issues — potholes, drainage blockages, illegal dumping, power outages and more — directly to local government authorities.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Features](#features)
- [Deployment](#deployment)
- [CI/CD](#cicd)

---

## Overview

Civic Reporting provides:

- **Citizens** — Submit geo-tagged reports with photos/videos, track status, get notified
- **Government Officers** — Receive assigned reports, update progress, add resolution notes
- **Admins** — Full dashboard: manage reports, users, departments, analytics

---

## Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Backend      | NestJS (Node.js) + TypeScript       |
| Database     | PostgreSQL 16 + PostGIS extension   |
| Cache        | Redis 7                             |
| Storage      | AWS S3                              |
| Auth         | JWT + Refresh Tokens + Google OAuth |
| Push Notifications | Firebase Cloud Messaging      |
| Admin Frontend | React 18 + TypeScript + Vite      |
| Styling      | TailwindCSS                         |
| Charts       | Recharts                            |
| Maps         | Mapbox GL JS                        |
| State        | Zustand + React Query               |
| Deployment   | Docker + GitHub Actions             |

---

## Project Structure

```
CIVIC REPORTING APP/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # JWT, Google OAuth, refresh tokens
│   │   │   ├── users/          # User management
│   │   │   ├── reports/        # Report CRUD, status workflow, GPS
│   │   │   ├── media/          # AWS S3 file uploads
│   │   │   ├── comments/       # Report comments
│   │   │   ├── departments/    # Government departments
│   │   │   ├── assignments/    # Report assignments
│   │   │   ├── notifications/  # FCM push notifications
│   │   │   └── analytics/      # Charts & KPI data
│   │   ├── common/             # Guards, decorators, filters
│   │   ├── config/             # App, DB, JWT, AWS, Firebase configs
│   │   └── database/
│   │       └── migrations/     # PostgreSQL + PostGIS schema
│   └── Dockerfile
├── frontend/                   # React Admin Dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── dashboard/      # KPI cards + charts
│   │   │   ├── reports/        # Reports list + detail view
│   │   │   ├── map/            # Mapbox interactive map
│   │   │   ├── analytics/      # Full analytics page
│   │   │   ├── users/          # User management
│   │   │   └── departments/    # Departments CRUD
│   │   ├── components/         # Reusable UI components
│   │   ├── services/           # Axios API client
│   │   ├── store/              # Zustand auth store
│   │   ├── hooks/              # React Query hooks
│   │   └── types/              # TypeScript types
│   └── Dockerfile
├── .github/workflows/ci.yml    # GitHub Actions CI/CD
├── docker-compose.yml          # Production
├── docker-compose.dev.yml      # Development (DB + Redis only)
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 with PostGIS (or use Docker)

### 1. Clone and install

```bash
git clone https://github.com/your-org/civic-reporting-app.git
cd civic-reporting-app
npm run install:all
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your Mapbox token
```

### 3. Start infrastructure (DB + Redis)

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Run database migration

```bash
# Connect to postgres and run:
psql -U postgres -d civic_reporting -f backend/src/database/migrations/001_initial_schema.sql
```

### 5. Start development servers

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend && npm run start:dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

### Default Admin Login

| Field    | Value                    |
|----------|--------------------------|
| Email    | `admin@civicreport.ng`   |
| Password | `Admin@1234`             |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_HOST` | PostgreSQL host | ✅ |
| `DB_PASSWORD` | Database password | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token secret | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS S3 credentials | For media uploads |
| `AWS_S3_BUCKET_NAME` | S3 bucket name | For media uploads |
| `FIREBASE_PROJECT_ID` | Firebase project | For push notifications |
| `GOOGLE_CLIENT_ID` | Google OAuth | For social login |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | ✅ |
| `VITE_MAPBOX_TOKEN` | Mapbox public token | ✅ for map |

---

## API Documentation

Swagger UI is available at:

```
http://localhost:3000/api/docs
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `GET`  | `/api/v1/reports` | List reports (with filters) |
| `POST` | `/api/v1/reports` | Submit a report |
| `PATCH`| `/api/v1/reports/:id/status` | Update report status |
| `GET`  | `/api/v1/reports/map` | All reports for map view |
| `POST` | `/api/v1/media/upload/:reportId` | Upload media files |
| `GET`  | `/api/v1/analytics/overview` | Dashboard KPIs |
| `GET`  | `/api/v1/analytics/reports-by-month` | Monthly chart data |
| `GET`  | `/api/v1/notifications` | User notifications |

---

## Features

### ✅ MVP (Implemented)

- **Auth**: Email/phone + password, JWT refresh tokens, Google OAuth, password reset
- **Reports**: Submit with GPS, photo/video upload, category, status tracking
- **Status Workflow**: submitted → verified → assigned → in_progress → resolved / rejected
- **Map**: Interactive Mapbox map with color-coded markers by status
- **Comments**: Internal (staff-only) and public comments on reports
- **Departments**: Government department management and report assignment
- **Notifications**: FCM push notifications on status changes
- **Analytics**: Monthly trends, category breakdown, department performance, resolution metrics
- **Security**: Helmet, rate limiting, JWT, RBAC, input validation, bcrypt hashing
- **Admin Dashboard**: Full management UI with filters, search, pagination

### 🔜 Phase 2 (Planned)

- [ ] AI-powered report categorization
- [ ] Duplicate report detection
- [ ] Offline reporting with sync (Flutter mobile app)
- [ ] Community voting / upvotes (partially done)
- [ ] Public heat maps
- [ ] Emergency reporting
- [ ] QR code issue tracking
- [ ] Open data API portal
- [ ] Citizen reputation & leaderboards
- [ ] Predictive maintenance insights
- [ ] Yoruba / Hausa / Igbo localization

---

## Deployment

### Docker (Recommended)

```bash
# Copy and fill production env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Build and start all services
docker compose up -d

# View logs
docker compose logs -f
```

Services started:
- `postgres` on port `5432`
- `redis` on port `6379`
- `backend` on port `3000`
- `frontend` on port `80`

### Cloud Options

| Service | Recommendation |
|---------|---------------|
| Database | Supabase, Neon, or AWS RDS |
| Backend | Railway, Render, or AWS ECS |
| Frontend | Vercel, Netlify, or AWS S3 + CloudFront |
| Storage | AWS S3 |
| Monitoring | Sentry + Grafana |

---

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

1. **On every push/PR** — Lint, build, and test both backend and frontend
2. **On merge to `main`** — Build Docker images and push to GitHub Container Registry
3. **Deploy** — SSH into production server and run `docker compose pull && up`

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VITE_MAPBOX_TOKEN` | Mapbox token for frontend build |
| `VITE_API_URL` | Production API URL |
| `DEPLOY_HOST` | Production server IP |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | Private SSH key |

---

## License

MIT © Civic Reporting Team
