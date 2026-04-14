# ⛏️ MineMath

A Minecraft-themed educational platform for kids — math battles, English dictation, and more.

**Live:** https://d2t1k8gq76349c.cloudfront.net

---

## Features

- **Math Battle** — Fight Minecraft enemies by solving math problems
- **English Dictation** — Listen and spell words (Typing / Multiple Choice / Fill the Blank)
- **RoboTrainer** — AI-powered learning missions
- **Leaderboard** — Compete with other players
- **Parents Report** — Track your child's progress

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Express.js + TypeScript |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM |
| Auth | express-session + bcryptjs |
| Deploy | AWS Lambda + S3 + CloudFront |

---

## Project Structure

```
minemath/
├── client/               # React frontend
│   └── src/
│       ├── components/   # Shared components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom hooks
│       └── types/        # TypeScript types
├── server/               # Express backend
│   ├── lambda.ts         # AWS Lambda entry point
│   ├── routes.ts         # API routes
│   ├── db.ts             # Database connection
│   └── storage.ts        # Data access layer
├── shared/
│   └── schema.ts         # Drizzle ORM schema
├── serverless.yml        # Serverless Framework config
└── PROJECT_LOG.md        # Full change history
```

---

## AWS Infrastructure

| Resource | Value |
|----------|-------|
| S3 Bucket | `minemath-frontend-022187637285` |
| CloudFront | `E2DIDW4SMDZT2T` |
| Region | `us-east-1` |

---

## Local Development

```bash
npm install
npm run dev
```

Requires a `.env` file:
```
DATABASE_URL=your_neon_postgres_url
SESSION_SECRET=your_secret
```

---

## Deploy

**Backend (Lambda):**
```bash
npm run build:lambda
npx serverless deploy
```

**Frontend (S3 + CloudFront):**
```bash
npm run build
aws s3 sync dist/public s3://minemath-frontend-022187637285 --delete
aws cloudfront create-invalidation --distribution-id E2DIDW4SMDZT2T --paths "/*"
```

---

## Seed Database

```bash
npx tsx run-seed.ts
```
