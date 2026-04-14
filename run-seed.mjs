import dotenv from 'dotenv';
dotenv.config();

// Set DATABASE_URL before importing db
const { default: pg } = await import('pg');
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Import the seed data by reading the TS file logic directly
const { neon } = await import('@neondatabase/serverless');
const { drizzle } = await import('drizzle-orm/neon-http');

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Re-import schema
const schema = await import('./shared/schema.ts');
const { dictationWords } = schema;

// Run the seed
const { seedDictationWords } = await import('./server/dictation-seed.ts');
await seedDictationWords();
await pool.end();
