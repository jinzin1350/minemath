import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const result = await pool.query('SELECT COUNT(*) FROM dictation_words');
console.log('Words in database:', result.rows[0].count);
await pool.end();
