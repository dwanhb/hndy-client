import mysql from 'mysql2/promise'

// Railway injects DATABASE_URL as:
//   mysql://user:pass@host:port/dbname
// Fall back to individual env vars for local dev.
function createPool() {
  const url = process.env.DATABASE_URL
  if (url) {
    return mysql.createPool({
      uri: url,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    })
  }

  return mysql.createPool({
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'hndy',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
}

const pool = createPool()
export default pool
