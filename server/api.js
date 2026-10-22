import { neon } from "@neondatabase/serverless";
import { ensureSchema } from "./db.js";

let pool = null;
export async function getPool() {
  if (!pool) {
    pool = neon(process.env.DATABASE_URL);
    await ensureSchema();
  }
  return pool;
}

export async function getMe(cookieToken) {
  const pool = await getPool();
  if (!cookieToken) return { role: "guest" };
  const row = await pool`SELECT * FROM users WHERE github_id = (SELECT github_id FROM sessions WHERE token = ${cookieToken} LIMIT 1)`;
  if (!row.length) return { role: "guest" };
  return { role: row[0].role, name: row[0].name, login: row[0].login };
}

export async function loginUser(githubId, login, name, avatarUrl, role) {
  const pool = await getPool();
  await pool`INSERT INTO users (github_id, login, name, avatar_url, role) VALUES (${githubId}, ${login}, ${name}, ${avatarUrl}, ${role}) ON CONFLICT (github_id) DO UPDATE SET login = ${login}, name = ${name}, avatar_url = ${avatarUrl}, role = ${role}`;
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  await pool`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, 1, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY))`;
  return token;
}

export async function logoutUser(token) {
  const pool = await getPool();
  await pool`DELETE FROM sessions WHERE token = ${token}`;
}