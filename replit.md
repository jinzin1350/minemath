# Minecraft Math Adventure

## Overview

This is a Minecraft-themed educational math game built as a modern web application. Players solve addition problems to defeat enemies, level up, and track their daily progress through an engaging game interface. The application combines learning with gamification elements like achievements, progress tracking, and character progression.

The project features a complete full-stack architecture with React frontend, Express backend, PostgreSQL database, and Replit authentication. The game includes pixel-art Minecraft-style characters, animated combat sequences, and a comprehensive dashboard for tracking learning progress.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development
- **UI Framework**: Tailwind CSS with shadcn/ui component library 
- **Design System**: Minecraft-inspired pixel art aesthetic using 'Press Start 2P' font and block-based layouts
- **State Management**: React hooks with React Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **API Design**: RESTful endpoints with proper error handling and logging middleware
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Replit OIDC integration with Passport.js strategy

### Database Layer
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Design**: Normalized tables for users, daily progress, game sessions, achievements, and auth sessions
- **Migration System**: Drizzle Kit for database schema management

### Game Logic
- **Math Generation**: Dynamic addition problems with progressive difficulty
- **Combat System**: Turn-based mechanics where correct answers defeat enemies
- **Progress Tracking**: Daily statistics, streaks, and achievement unlocking
- **Character System**: Minecraft-style pixel art characters with animations

### Authentication & Authorization
- **Provider**: Replit's OpenID Connect implementation
- **Strategy**: Passport.js with session-based authentication
- **User Management**: Automatic user creation and profile management
- **Session Storage**: PostgreSQL-backed session store with TTL

### UI Components
- **Component Library**: Custom Minecraft-themed components built on Radix UI primitives
- **Responsive Design**: Mobile-first approach optimized for both desktop and mobile gameplay
- **Theming**: Dark mode focus with light mode support using CSS custom properties
- **Animations**: CSS animations for combat effects, character movements, and achievement notifications

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18 with TypeScript, Vite bundler, and Wouter routing
- **UI Libraries**: Radix UI primitives, Tailwind CSS, shadcn/ui components
- **State Management**: TanStack React Query for server state synchronization

### Backend Services
- **Database**: Neon PostgreSQL serverless database with connection pooling
- **Authentication**: Replit OIDC service integration
- **Session Store**: PostgreSQL session storage with connect-pg-simple

### Development Tools
- **Build System**: Vite with esbuild for fast compilation and HMR
- **Database Tools**: Drizzle ORM with Drizzle Kit for migrations
- **Code Quality**: TypeScript strict mode, ESLint configuration

### Third-Party Integrations
- **Fonts**: Google Fonts (Press Start 2P for pixel aesthetic, Inter for readability)
- **Icons**: Lucide React icon library for UI elements
- **Charts**: Recharts library for progress visualization

### Deployment Requirements
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS, ISSUER_URL
- **Runtime**: Node.js with ES modules support
- **Static Assets**: Vite build output served by Express in production