import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'hndy.db')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ─── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    provider_id   TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    service       TEXT NOT NULL,
    category      TEXT NOT NULL,
    scheduled_at  INTEGER NOT NULL,       -- Unix ms UTC
    notes         TEXT,
    address       TEXT,
    voucher_code  TEXT,
    discount_sgd  REAL DEFAULT 0,
    rate_per_hour REAL NOT NULL,
    estimated_hrs REAL DEFAULT 1,
    status        TEXT NOT NULL DEFAULT 'pending',
    created_at    INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    updated_at    INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  )
`)

// ─── Valid state transitions ──────────────────────────────────────────────────
const TRANSITIONS = {
  pending:     ['confirmed', 'cancelled'],
  confirmed:   ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed:   [],
  cancelled:   [],
}

function canTransition(from, to) {
  return TRANSITIONS[from]?.includes(to) ?? false
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function createBooking({ userId, providerId, providerName, service, category,
  scheduledAt, notes, address, voucherCode, discountSgd, ratePerHour, estimatedHrs }) {
  const stmt = db.prepare(`
    INSERT INTO bookings
      (user_id, provider_id, provider_name, service, category,
       scheduled_at, notes, address, voucher_code, discount_sgd,
       rate_per_hour, estimated_hrs, status, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `)
  const now = Date.now()
  const result = stmt.run(
    userId, providerId, providerName, service, category,
    scheduledAt, notes || null, address || null,
    voucherCode || null, discountSgd || 0,
    ratePerHour, estimatedHrs || 1, now, now
  )
  return getBookingById(result.lastInsertRowid)
}

export function getBookingById(id) {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) || null
}

export function getBookingsByUser(userId) {
  return db.prepare(`
    SELECT * FROM bookings
    WHERE user_id = ?
    ORDER BY scheduled_at DESC
  `).all(userId)
}

export function transitionBooking(id, userId, newStatus) {
  const booking = getBookingById(id)
  if (!booking) throw new Error('Booking not found')
  if (booking.user_id !== userId) throw new Error('Forbidden')
  if (!canTransition(booking.status, newStatus)) {
    throw new Error(`Cannot transition from '${booking.status}' to '${newStatus}'`)
  }
  db.prepare(`
    UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?
  `).run(newStatus, Date.now(), id)
  return getBookingById(id)
}

export function cancelBooking(id, userId) {
  return transitionBooking(id, userId, 'cancelled')
}

// ─── Voucher validation (simple lookup table) ─────────────────────────────────
const VOUCHERS = {
  HNDY15:   { discount: 15,  description: 'S$15 off first booking' },
  HNDY10:   { discount: 10,  description: 'S$10 off first booking' },
  ELEC2026: { discount: 20,  description: 'S$20 off electrical services' },
}

export function validateVoucher(code) {
  const voucher = VOUCHERS[code?.toUpperCase()]
  if (!voucher) return null
  return { code: code.toUpperCase(), ...voucher }
}
