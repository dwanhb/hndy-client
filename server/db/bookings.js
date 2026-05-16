import pool from './pool.js'

// ─── Schema bootstrap ─────────────────────────────────────────────────────────
export async function initBookingsSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT          NOT NULL,
      provider_id   VARCHAR(100) NOT NULL,
      provider_name VARCHAR(255) NOT NULL,
      service       VARCHAR(255) NOT NULL,
      category      VARCHAR(100) NOT NULL,
      scheduled_at  BIGINT       NOT NULL,
      notes         TEXT,
      address       TEXT,
      voucher_code  VARCHAR(50),
      discount_sgd  DECIMAL(10,2) DEFAULT 0,
      rate_per_hour DECIMAL(10,2) NOT NULL,
      estimated_hrs DECIMAL(5,2)  DEFAULT 1,
      status        ENUM('pending','confirmed','in_progress','completed','cancelled')
                    NOT NULL DEFAULT 'pending',
      created_at    BIGINT NOT NULL,
      updated_at    BIGINT NOT NULL
    )
  `)
}

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

export async function createBooking({
  userId, providerId, providerName, service, category,
  scheduledAt, notes, address, voucherCode, discountSgd, ratePerHour, estimatedHrs
}) {
  const now = Date.now()
  const [result] = await pool.execute(
    `INSERT INTO bookings
       (user_id, provider_id, provider_name, service, category,
        scheduled_at, notes, address, voucher_code, discount_sgd,
        rate_per_hour, estimated_hrs, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      userId, providerId, providerName, service, category,
      scheduledAt, notes || null, address || null,
      voucherCode || null, discountSgd || 0,
      ratePerHour, estimatedHrs || 1, now, now
    ]
  )
  return getBookingById(result.insertId)
}

export async function getBookingById(id) {
  const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id])
  return rows[0] || null
}

export async function getBookingsByUser(userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM bookings WHERE user_id = ? ORDER BY scheduled_at DESC',
    [userId]
  )
  return rows
}

export async function transitionBooking(id, userId, newStatus) {
  const booking = await getBookingById(id)
  if (!booking) throw new Error('Booking not found')
  if (booking.user_id !== userId) throw new Error('Forbidden')
  if (!canTransition(booking.status, newStatus)) {
    throw new Error(`Cannot transition from '${booking.status}' to '${newStatus}'`)
  }
  await pool.execute(
    'UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?',
    [newStatus, Date.now(), id]
  )
  return getBookingById(id)
}

export async function cancelBooking(id, userId) {
  return transitionBooking(id, userId, 'cancelled')
}

// ─── Voucher validation ───────────────────────────────────────────────────────
const VOUCHERS = {
  HNDY15:   { discount: 15, description: 'S$15 off first booking' },
  HNDY10:   { discount: 10, description: 'S$10 off first booking' },
  ELEC2026: { discount: 20, description: 'S$20 off electrical services' },
}

export function validateVoucher(code) {
  const voucher = VOUCHERS[code?.toUpperCase()]
  if (!voucher) return null
  return { code: code.toUpperCase(), ...voucher }
}
