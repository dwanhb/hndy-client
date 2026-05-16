import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'hndy.db')

const db = new Database(DB_PATH)

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    password_hash TEXT NOT NULL,
    avatar_initials TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  )
`)

export function createUser({ name, email, phone, passwordHash }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const stmt = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, avatar_initials)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = stmt.run(name, email, phone || null, passwordHash, initials)
  return getUserById(result.lastInsertRowid)
}

export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email)
}

export function getUserById(id) {
  return db.prepare('SELECT id, name, email, phone, address, avatar_initials, created_at FROM users WHERE id = ?').get(id)
}

export function updateUser(id, { name, phone, address }) {
  const fields = []
  const values = []
  if (name !== undefined) { fields.push('name = ?'); values.push(name) }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone) }
  if (address !== undefined) { fields.push('address = ?'); values.push(address) }
  if (fields.length === 0) return getUserById(id)
  values.push(id)
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return getUserById(id)
}

export default db
