# AI Project Evaluation — Technical Documentation

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Frontend](#3-frontend)
4. [Backend](#4-backend)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [AI Evaluation Pipeline](#7-ai-evaluation-pipeline)
8. [Queue System](#8-queue-system)
9. [File Storage](#9-file-storage)
10. [API Reference](#10-api-reference)
11. [Environment Variables](#11-environment-variables)
12. [Deployment](#12-deployment)

---

## 1. System Overview

**AI Project Evaluation** is a full-stack web application that enables academic institutions to manage and evaluate student projects using a combination of AI-powered analysis and human judge review.

### Key Capabilities

- Students register, form teams, submit projects (PDF reports, PPT, GitHub URL)
- AI automatically evaluates submissions using LLM (NVIDIA NIM / LangGraph pipeline)
- Judges review AI scores, set rubrics, and provide final scores and feedback
- Admins manage users, judges, projects, and view analytics
- Real-time notifications for all role types
- Leaderboard with final scores

### User Roles

| Role | Description |
|---|---|
| `STUDENT` | Registers, creates/joins teams, submits projects |
| `JUDGE` | Reviews submissions, sets rubrics, provides scores and feedback |
| `ADMIN` | Full system access — manages users, judges, projects, analytics |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                 │
│          React 19 + TanStack Router + Vite           │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS (Axios)
┌────────────────────▼────────────────────────────────┐
│                 Backend API (Railway)                │
│            Express 5 + better-auth + Prisma          │
└──────┬────────────────────┬────────────────┬────────┘
       │                    │                │
┌──────▼──────┐   ┌────────▼──────┐  ┌──────▼──────┐
│  PostgreSQL  │   │   RabbitMQ    │  │    Redis    │
│  (NeonDB)   │   │ (CloudAMQP)   │  │ (Rate limit)│
└─────────────┘   └───────┬───────┘  └─────────────┘
                          │
              ┌───────────▼───────────┐
              │      Workers          │
              │  doc / github /       │
              │  agent / notification │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │   NVIDIA NIM / LLM    │
              │  (LangGraph Pipeline) │
              └───────────────────────┘
```

### Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, TanStack Router, TanStack Query |
| Styling | Tailwind CSS 3, shadcn/ui, Radix UI |
| State Management | Zustand 5 |
| Backend | Node.js, Express 5, TypeScript |
| ORM | Prisma 7 (PostgreSQL) |
| Auth | better-auth 1.6 |
| AI | NVIDIA NIM (LLaMA 3.1), LangChain, LangGraph, Google Gemini |
| Queue | RabbitMQ (CloudAMQP) via amqplib |
| Cache / Rate Limit | Redis 4.7 |
| File Storage | Cloudinary (production), Local disk (development) |
| Observability | LangFuse (LLM tracing) |

---

## 3. Frontend

### Project Structure

```
src/
├── components/
│   ├── layout/          # AppSidebar, SidebarLayout, ThemeProvider
│   ├── shared/          # Reusable UI: ScoreBadge, StatusBadge, StatCard,
│   │                    #   EvaluationSummaryCard, EmptyState, ErrorCard,
│   │                    #   LoadingSkeleton, ConfirmDialog
│   └── ui/              # shadcn/ui primitives: Badge, Button, Input, Table
├── lib/
│   ├── api.ts           # Axios instance with interceptors
│   ├── queryClient.ts   # TanStack Query client config
│   ├── queryKeys.ts     # Centralized query key factory
│   ├── brandColors.ts   # Chart / score color palette
│   └── validations/     # Zod schemas for all forms
├── routes/              # TanStack Router file-based routes
├── services/            # API call functions per domain
├── store/               # Zustand stores
├── types/               # TypeScript interfaces
└── main.tsx             # App entry point
```

### Routing

Uses **TanStack Router** with file-based routing. Routes are auto-generated into `routeTree.gen.ts`.

```
/                         → Landing / redirect
/login                    → Student login
/judge-login              → Judge login
/admin-login              → Admin login
/signup                   → Student registration
/forgot-password          → Password reset request
/reset-password           → Password reset form

/_authenticated/          → Protected layout (requires valid session)
  /student/
    /dashboard            → Student home, stats, recent activity
    /projects             → Project list
    /projects/:projectId  → Project detail
    /teams                → Team management
    /submissions          → Submission history
    /leaderboard          → Score leaderboard
    /profile              → Profile settings
    /settings             → Account settings
    /notifications        → Notification center
    /change-password      → Password change

  /judge/
    /dashboard            → Judge home
    /reviews              → Assigned evaluations
    /evaluations/:id      → Evaluation detail with rubric and scoring
    /leaderboard          → Project leaderboard
    /profile
    /settings
    /notifications

  /admin/
    /dashboard            → System stats
    /users                → User management
    /judges               → Judge management
    /projects             → All projects
    /teams                → All teams
    /evaluations          → All evaluations
    /analytics            → Charts and reports
    /settings
    /notifications
```

### State Management (Zustand)

| Store | Purpose |
|---|---|
| `authStore` | Current user, token, role, `setUser`, `clearAuth` |

### API Layer

`src/lib/api.ts` — Axios instance:
- `baseURL` from `VITE_API_URL` env variable
- `timeout`: 60,000ms (handles Railway cold starts)
- **Request interceptor**: Injects `Authorization: Bearer <token>` from localStorage / sessionStorage
- **Response interceptor**: Extracts `message` from error responses, handles 401 by clearing auth and redirecting to login

### Services

| File | Domain |
|---|---|
| `authService.ts` | signIn, signUp, signOut, getSession, forgotPassword, resetPassword |
| `adminService.ts` | User CRUD, system stats |
| `judgeService.ts` | Judge profile, assigned evaluations |
| `studentService.ts` | Student profile, dashboard data |
| `projectService.ts` | Project CRUD |
| `teamService.ts` | Team creation, membership |
| `submissionService.ts` | File uploads, submission history |
| `evaluationService.ts` | Scores, rubric, feedback |
| `notificationService.ts` | Notifications list and mark-read |

### Form Validation

All forms use **React Hook Form** + **Zod** schemas located in `src/lib/validations/`:

- `authSchemas.ts` — login, signup, password reset
- `projectSchemas.ts` — project creation/edit
- `submissionSchemas.ts` — submission form
- `evaluationSchemas.ts` — judge scoring
- `teamSchemas.ts` — team creation
- `judgeSchemas.ts` — judge profile
- `studentSchemas.ts` — student profile

---

## 4. Backend

### Project Structure

```
src/
├── app.ts                   # Express app setup, middleware registration
├── server.ts                # Bootstrap — DB connect, RabbitMQ, listen
├── auth/
│   └── auth.ts              # better-auth configuration
├── config/
│   ├── env.ts               # Zod-validated environment variables
│   ├── rabbitmq.ts          # RabbitMQ connection
│   ├── redis.ts             # Redis client singleton (rate limiting)
│   └── cloudinary.ts        # Cloudinary SDK config
├── database/                # Prisma client singleton
├── docs/
│   └── swagger.ts           # OpenAPI / Swagger UI setup
├── features/
│   ├── health/
│   │   ├── controllers/     # Business logic per domain
│   │   └── routes/          # Express routers
│   └── project-evaluation/
│       ├── controllers/
│       ├── langgraph/       # LangGraph AI evaluation pipeline
│       └── routes/
├── middleware/
│   ├── auth-middleware.ts   # requireAuth, requireRole guards
│   ├── error-handler.ts     # Global error handler
│   ├── not-found.ts         # 404 handler
│   └── rate-limit.ts        # Redis-backed rate limiting
├── middlewares/
│   └── upload.ts            # Multer config + Cloudinary upload helper
├── queue/
│   ├── producer.ts          # publishMessage helper
│   └── queues.ts            # Queue name constants
├── workers/                 # Background queue consumers
├── utils/                   # PDF parser, GitHub fetcher, Gemini helper
└── types/                   # Shared TypeScript types
```

### Express App Setup (`app.ts`)

1. CORS — allows `FRONTEND_URL`, all `*.vercel.app`, and localhost origins
2. Swagger UI registered at `/api/docs`
3. Cookie parser
4. OPTIONS preflight handler for `/api/auth/*path` (better-auth compatibility)
5. better-auth handler at `/api/auth` (via `toNodeHandler`)
6. `express.json()` + `express.urlencoded()`
7. Static file serving at `/uploads` (development only)
8. Feature routers with rate limiting per domain
9. 404 and global error handlers

### Middleware

#### Auth Guards

```typescript
requireAuth   // verifies session token via better-auth
requireRole("ADMIN" | "JUDGE" | "STUDENT")  // role-based access
```

#### Rate Limiting

Redis-backed rate limiter. Falls back gracefully if Redis is unavailable.

| Limiter | Limit | Window |
|---|---|---|
| `authRateLimit` | 10 req | 15 min |
| `apiRateLimit` | 100 req | 1 min |
| `evaluationRateLimit` | 30 req | 1 min |
| `uploadRateLimit` | 20 req | 1 min |

---

## 5. Database Schema

PostgreSQL via **Prisma 7** hosted on **NeonDB**.

### Entity Relationship Overview

```
User ──────────── Student ──── TeamMember ──── Team ──── Project ──── Submission ──── Evaluation
     ├─────────── Judge  ─────────────────────────────────────────────────────────────────┘
     └─────────── Admin
     └─────────── Notification
     └─────────── Session / Account (better-auth)
```

### Models

#### User
Core auth model managed by better-auth.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | |
| username | String? | Unique |
| email | String | Unique |
| role | Enum (STUDENT/JUDGE/ADMIN) | Default: STUDENT |
| mustChangePassword | Boolean | Set for judge accounts created by admin |

#### Student
Extended profile linked to User.

| Field | Type |
|---|---|
| rollNumber | String (unique) |
| department | String |
| collegeName | String |
| phonenumber | BigInt |
| year | Int |
| cgpa | Decimal? |
| githubUrl, leetcode, portfolio, linkedin | String? |

#### Judge
| Field | Type |
|---|---|
| organization, designation | String? |
| expertise | String[] |
| experience | Int? |
| bio | String? |

#### Team
| Field | Type |
|---|---|
| name | String (unique) |
| teamLeaderId | FK → Student |
| members | TeamMember[] |
| projects | Project[] |

#### Project
| Field | Type | Notes |
|---|---|---|
| title, description, domain | String | |
| status | Enum | DRAFT → SUBMITTED → EVALUATING → EVALUATED |
| githubUrl, reportUrl, pptUrl, videoUrl | String? | |
| teamId | FK → Team | |

#### Submission
Versioned submission per project.

| Field | Type |
|---|---|
| projectId | FK → Project |
| version | Int (default 1) |
| githubUrl, reportUrl, pptUrl, videoUrl | String? |
| status | Enum: SUBMITTED → EVALUATING → EVALUATED |

#### Evaluation
Stores both AI and judge scores.

| Field | Type | Notes |
|---|---|---|
| aiScore, judgeScore, finalScore | Decimal? | |
| problemStatementScore, solutionDesignScore, implementationScore, innovationScore, documentationScore | Decimal? | Per-dimension AI scores |
| strengths, weaknesses, suggestions | String[] | AI-generated |
| feedback | String? | Judge feedback |
| status | Enum | PENDING → AI_EVALUATING → AI_COMPLETED → JUDGE_EVALUATING → COMPLETED |
| rubric* fields | Int? | Judge-defined rubric weights |
| pdfText, pptText, githubSummary | String? | Extracted by workers |
| documentAnalysis, codeAnalysis | Json? | Intermediate AI output |

#### Notification
| Field | Type |
|---|---|
| userId | FK → User |
| type | String |
| message | String |
| read | Boolean |
| entityId | String? |

---

## 6. Authentication & Authorization

### better-auth Setup

- Email + password authentication
- Session-based with cookie support
- Bearer token support (via `bearer` plugin) for API clients
- Custom user fields: `role`, `username`, `mustChangePassword`
- `trustedOrigins`: Frontend URL, all `*.vercel.app`, localhost variants

### Auth Flow

```
1. POST /api/auth/sign-in/email  → returns { user, token, session }
2. Frontend stores token in localStorage (rememberMe) or sessionStorage
3. Axios interceptor injects Authorization: Bearer <token> on all requests
4. requireAuth middleware calls better-auth getSession to validate
5. requireRole middleware checks user.role against required role
```

### Password Reset Flow

```
1. POST /api/auth/forgot-password  → sends reset email
2. User clicks link → /reset-password?token=xxx
3. POST /api/auth/reset-password   → updates password
```

### Judge Account Creation

Admin creates judge accounts via `POST /api/admin/judges`. The backend:
1. Calls `auth.api.signUpEmail` to create the user
2. Updates role to `JUDGE` via `prisma.user.update`
3. Sets `mustChangePassword: true`
4. Judge is prompted to change password on first login

---

## 7. AI Evaluation Pipeline

### Overview

When a submission is created, it goes through a multi-stage async pipeline:

```
Submission Created
      │
      ▼
[doc-worker]  ← Extracts text from PDF / PPT (pdf-parse, officeparser)
      │
      ▼
[github-worker] ← Fetches README, file tree, language stats via GitHub API
      │
      ▼
[agent-worker]  ← LangGraph pipeline runs LLM evaluation
      │
      ▼
[notification-worker] ← Sends notification to student and assigned judge
```

### LangGraph Pipeline (agent-worker)

The agent uses **LangGraph** with **NVIDIA NIM** (LLaMA 3.1) as the LLM:

**Evaluation Dimensions:**
- Problem Statement (clarity, relevance)
- Solution Design (architecture, approach)
- Implementation (code quality, functionality)
- Innovation (originality, creativity)
- Documentation (completeness, clarity)

**Output per evaluation:**
- Score per dimension (0–10)
- Overall AI score
- Strengths list
- Weaknesses list
- Suggestions for improvement

### LangFuse Observability

All LLM calls are traced via **LangFuse** for:
- Prompt/completion logging
- Token usage tracking
- Latency monitoring
- Cost estimation

### PDF Evaluation Endpoint

`POST /api/evaluation/pdf` — accepts a PDF file, uploads to Cloudinary (production), publishes to `PDF_EVAL` queue for async processing.

---

## 8. Queue System

**RabbitMQ** via CloudAMQP. Non-fatal on startup — API server runs even if queue is unavailable.

### Queues

| Queue | Producer | Consumer | Purpose |
|---|---|---|---|
| `PDF_EVAL` | project-evaluation controller | doc-worker | PDF text extraction |
| `GITHUB_EVAL` | doc-worker | github-worker | GitHub repo analysis |
| `AGENT_EVAL` | github-worker | agent-worker | LLM evaluation |
| `NOTIFICATION` | agent-worker | notification-worker | User notifications |

### Message Flow

```typescript
// Producer
await publishMessage(QUEUES.PDF_EVAL, { filePath, submissionId });

// Consumer (worker)
channel.consume(QUEUES.PDF_EVAL, async (msg) => {
  const { filePath, submissionId } = JSON.parse(msg.content.toString());
  // process...
  channel.ack(msg);
});
```

---

## 9. File Storage

### Production (Cloudinary)

Files are uploaded to Cloudinary with:
- Folder: `ai-project-evaluation`
- PDFs uploaded as `resource_type: "raw"`
- Images/PPTs uploaded as `resource_type: "auto"`
- Returns `secure_url` stored in database

### Development (Local Disk)

Files saved to `./uploads/` directory, served statically at `/uploads/:filename`.

### Upload Middleware

`src/middlewares/upload.ts`:
- **Production**: `multer.memoryStorage()` → buffer piped to Cloudinary
- **Development**: `multer.diskStorage()` → saved to `./uploads/`
- Max file size: 20MB
- Supported: PDF, PPT, PPTX, images

---

## 10. API Reference

Live docs available at:
- **Swagger UI**: `https://ai-project-evaluation-backend-production.up.railway.app/api/docs`
- **OpenAPI JSON**: `https://ai-project-evaluation-backend-production.up.railway.app/api/docs.json`

### Route Summary

#### Auth (`/api/auth/*`)
Handled by better-auth — see [better-auth docs](https://better-auth.com)

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/sign-in/email` | POST | Login with email + password |
| `/api/auth/sign-up/email` | POST | Register new account |
| `/api/auth/sign-out` | POST | Sign out |
| `/api/auth/get-session` | GET | Get current session |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |

#### Health
| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Server health check |

#### Admin (`/api/admin/*`) — Role: ADMIN
| Endpoint | Method | Description |
|---|---|---|
| `/api/admin/dashboard` | GET | System stats |
| `/api/admin/users` | GET | All users |
| `/api/admin/judges` | GET/POST | List / create judges |
| `/api/admin/judges/:id` | PUT/DELETE | Update / delete judge |
| `/api/admin/projects` | GET | All projects |
| `/api/admin/evaluations` | GET | All evaluations |

#### Student (`/api/student/*`) — Role: STUDENT
| Endpoint | Method | Description |
|---|---|---|
| `/api/student/profile` | GET/PUT | Profile CRUD |
| `/api/student/dashboard` | GET | Dashboard stats |

#### Judge (`/api/judge/*`) — Role: JUDGE
| Endpoint | Method | Description |
|---|---|---|
| `/api/judge/profile` | GET/PUT | Profile CRUD |
| `/api/judge/dashboard` | GET | Assigned evaluations summary |

#### Teams (`/api/team/*`) — Role: STUDENT
| Endpoint | Method | Description |
|---|---|---|
| `/api/team` | GET/POST | List / create teams |
| `/api/team/:id` | GET/PUT/DELETE | Team CRUD |
| `/api/team/:id/members` | POST/DELETE | Add / remove members |

#### Projects (`/api/project/*`)
| Endpoint | Method | Description |
|---|---|---|
| `/api/project` | GET/POST | List / create projects |
| `/api/project/:id` | GET/PUT/DELETE | Project CRUD |

#### Submissions (`/api/submission/*`)
| Endpoint | Method | Description |
|---|---|---|
| `/api/submission` | GET/POST | List / create submissions (multipart/form-data) |
| `/api/submission/:id` | GET | Submission detail |

#### Evaluations (`/api/evaluation/*`)
| Endpoint | Method | Description |
|---|---|---|
| `/api/evaluation` | GET | All evaluations |
| `/api/evaluation/:id` | GET/PUT | Evaluation detail / update scores |
| `/api/evaluation/pdf` | POST | Upload PDF for AI evaluation |
| `/api/evaluation/github` | POST | Submit GitHub URL for AI evaluation |

#### Analytics (`/api/analytics/*`) — Role: ADMIN
| Endpoint | Method | Description |
|---|---|---|
| `/api/analytics/overview` | GET | Score distributions, trends |
| `/api/analytics/leaderboard` | GET | Top scoring projects |

#### Notifications (`/api/notifications/*`)
| Endpoint | Method | Description |
|---|---|---|
| `/api/notifications` | GET | List notifications |
| `/api/notifications/:id/read` | PUT | Mark as read |
| `/api/notifications/read-all` | PUT | Mark all as read |

---

## 11. Environment Variables

### Frontend (Vercel)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `https://ai-project-evaluation-backend-production.up.railway.app` |

### Backend (Railway)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `3000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string (NeonDB) |
| `BETTER_AUTH_SECRET` | Yes | Min 32 char secret for session signing |
| `BETTER_AUTH_URL` | Yes | Backend public URL |
| `FRONTEND_URL` | Yes | Frontend URL (for CORS + trusted origins) |
| `NVIDIA_API_KEY` | Yes | NVIDIA NIM API key |
| `NIM_MODEL` | No | Default: `meta/llama-3.1-8b-instruct` |
| `AMQP_URL` | Yes | CloudAMQP connection string |
| `REDIS_HOST` | No | Redis host (rate limiting) |
| `REDIS_PORT` | No | Redis port |
| `REDIS_USERNAME` | No | Redis username |
| `REDIS_PASSWORD` | No | Redis password |
| `CLOUDINARY_CLOUD_NAME` | Yes (prod) | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes (prod) | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes (prod) | Cloudinary API secret |
| `LANGFUSE_PUBLIC_KEY` | No | LangFuse tracing public key |
| `LANGFUSE_SECRET_KEY` | No | LangFuse tracing secret key |
| `LANGFUSE_BASE_URL` | No | LangFuse endpoint |
| `GITHUB_TOKEN` | No | GitHub API token (higher rate limits) |

---

## 12. Deployment

### Frontend — Vercel

- Auto-deploys from `main` branch of `Mohan0621/ai-project-evaluation`
- Build command: `pnpm build` (`tsc -b && vite build`)
- Output: `dist/`
- SPA routing: all paths serve `index.html`

### Backend — Railway

- Deployed via `railway up` or auto-deploy from connected GitHub repo
- Build command: `pnpm install && pnpm build` (`prisma generate && tsc`)
- Start command: `node dist/server.js`
- Health check: `GET /api/health`
- Workers run as separate processes (not deployed as part of the main service)

### Workers

Workers are separate Node.js processes that consume from RabbitMQ queues:

```bash
pnpm worker:doc          # PDF/PPT text extraction
pnpm worker:github       # GitHub repo analysis
pnpm worker:agent        # LangGraph AI evaluation
pnpm worker:notification # Notification dispatch
```

In production these need to run as separate Railway services or background processes.

### Database Migrations

```bash
# Run migrations
pnpm prisma:migrate

# Open Prisma Studio (local)
pnpm prisma:studio
```

---

*Generated from codebase analysis — July 2026*
