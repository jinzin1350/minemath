import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const email = 'engi.alireza@gmail.com';
const newPassword = 'Admin1234!';

const hash = await bcrypt.hash(newPassword, 10);

const result = await pool.query(
  'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
  [hash, email]
);

if (result.rows.length === 0) {
  console.log('User not found with email:', email);
} else {
  console.log('Password reset successfully for:', result.rows[0].email);
  console.log('New password:', newPassword);
}

await pool.end();
