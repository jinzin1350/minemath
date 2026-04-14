<div align="center">

# ⛏️ MineMath

**A Minecraft-themed educational platform for kids**

Math battles · English dictation · AI-powered learning

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-brightgreen?style=for-the-badge)](https://d2t1k8gq76349c.cloudfront.net)
[![Node](https://img.shields.io/badge/Node-20.x-green?style=flat-square&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://react.dev)
[![AWS](https://img.shields.io/badge/AWS-Lambda%20%2B%20CloudFront-orange?style=flat-square&logo=amazon-aws)](https://aws.amazon.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

</div>

---

## 🎮 What is MineMath?

MineMath is an educational web app that makes learning fun for kids through a Minecraft-inspired theme. Kids fight enemies by solving math problems, practice spelling with English dictation, and train their AI robot companion — all wrapped in a pixel-art game feel.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| ⚔️ **Math Battle** | Solve math problems to defeat Minecraft enemies (zombies, skeletons, creepers) |
| 🎧 **English Dictation** | Listen to words and practice spelling in 3 modes: Typing, Multiple Choice, Fill the Blank |
| 🤖 **RoboTrainer** | Train and level up your personal AI robot companion |
| 🏆 **Leaderboard** | Global rankings — compete with other players |
| 📊 **Parents Report** | Detailed progress reports for parents |
| 🎨 **Minecraft Theme** | Pixel font, dark emerald/amber colors, block-style UI throughout |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TailwindCSS + Wouter |
| **Backend** | Express.js + TypeScript |
| **Database** | Neon PostgreSQL (serverless) |
| **ORM** | Drizzle ORM |
| **Auth** | express-session + bcryptjs + connect-pg-simple |
| **Deploy** | AWS Lambda (Serverless Framework) + S3 + CloudFront |

---

## 🏗️ Architecture

```
User
 │
 └── CloudFront (d2t1k8gq76349c.cloudfront.net)
       ├── /          → S3 Bucket (React SPA)
       └── /api/*     → API Gateway → Lambda (Express.js)
                                            │
                                            └── Neon PostgreSQL
```

---

## 📁 Project Structure

```
minemath/
├── client/                   # React frontend
│   └── src/
│       ├── components/       # Shared UI components
│       │   ├── BottomNav.tsx       # Mobile bottom navigation
│       │   ├── DictationGame.tsx   # Dictation game engine
│       │   ├── DictationResults.tsx
│       │   ├── GameInterface.tsx   # Math battle engine
│       │   └── ...
│       ├── pages/            # Route-level pages
│       ├── hooks/            # Custom React hooks
│       └── types/            # TypeScript type definitions
├── server/                   # Express.js backend
│   ├── lambda.ts             # AWS Lambda entry point
│   ├── routes.ts             # API route definitions
│   ├── db.ts                 # Neon HTTP database connection
│   ├── storage.ts            # Data access layer
│   └── simpleAuth.ts         # Auth & session management
├── shared/
│   └── schema.ts             # Drizzle ORM schema (single source of truth)
├── serverless.yml            # AWS Lambda deployment config
├── run-seed.ts               # Database seeder (687 English words)
└── PROJECT_LOG.md            # Full detailed change history
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- AWS CLI (for deployment)

### Local Development

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Fill in your DATABASE_URL and SESSION_SECRET

# Start dev server
npm run dev
```

App runs at `http://localhost:5000`

### Environment Variables

```env
DATABASE_URL=postgresql://...      # Neon database connection string
SESSION_SECRET=your-secret-here    # Random string for session signing
NODE_ENV=development
```

---

## 🗄️ Database Setup

Run migrations then seed English dictation words:

```bash
npm run db:push
npx tsx run-seed.ts
```

---

## ☁️ Deployment

### Backend — AWS Lambda

```bash
npm run build:lambda
npx serverless deploy
```

### Frontend — S3 + CloudFront

```bash
npm run build
aws s3 sync dist/public s3://minemath-frontend-022187637285 --delete
aws cloudfront create-invalidation --distribution-id E2DIDW4SMDZT2T --paths "/*"
```

---

## 📸 Screenshots

> Minecraft-themed dark UI with pixel font, block-style cards, emerald/amber color palette

| Math Battle | English Dictation | Results |
|:-----------:|:-----------------:|:-------:|
| Fight enemies with math | Listen & spell words | Stars + score breakdown |

---

## 📄 License

MIT
