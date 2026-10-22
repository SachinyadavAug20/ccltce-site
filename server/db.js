import { neon } from "@neondatabase/serverless";

export async function ensureSchema() {
  const db = neon(process.env.DATABASE_URL);
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      github_id TEXT UNIQUE,
      login TEXT,
      name TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'participant',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      expires_at TIMESTAMPTZ
    )
  `;
  console.log("Neon schema ensured.");
}