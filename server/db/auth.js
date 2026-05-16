import pool from './pool.js'

// ─── Schema bootstrap ─────────────────────────────────────────────────────────
export async function initAuthSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      name            VARCHAR(255) NOT NULL,
      email           VARCHAR(255) NOT NULL UNIQUE,
      phone           VARCHAR(50),
      address         TEXT,
      password_hash   VARCHAR(255) NOT NULL,
      avatar_initials VARCHAR(4)   NOT NULL,
      created_at      BIGINT       NOT NULL DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000)
    )
  `)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function createUser({ name, email, phone, passwordHash }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const [result] = await pool.execute(
    `INSERT INTO users (name, email, phone, password_hash, avatar_initials)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, phone || null, passwordHash, initials]
  )
  return getUserById(result.insertId)
}

export async function getUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  )
  return rows[0] || null
}

export async function getUserById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, address, avatar_initials, created_at FROM users WHERE id = ?',
    [id]
  )
  return rows[0] || null
}

export async function updateUser(id, { name, phone, address }) {
  const fields = []
  const values = []
  if (name    !== undefined) { fields.push('name = ?');    values.push(name) }
  if (phone   !== undefined) { fields.push('phone = ?');   values.push(phone) }
  if (address !== undefined) { fields.push('address = ?'); values.push(address) }
  if (fields.length === 0) return getUserById(id)
  values.push(id)
  await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values)
  return getUserById(id)
}
