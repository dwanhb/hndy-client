import express from 'express'
import { requireAuth } from './auth.js'
import {
  createBooking,
  getBookingsByUser,
  getBookingById,
  transitionBooking,
  cancelBooking,
  validateVoucher,
} from '../db/bookings.js'

const router = express.Router()

// All booking routes require authentication
router.use(requireAuth)

// ─── POST /api/bookings/validate-voucher ─────────────────────────────────────
// Must be before /:id routes to avoid being caught by them
router.post('/validate-voucher', (req, res) => {
  const { code } = req.body
  const voucher = validateVoucher(code)
  if (!voucher) return res.status(404).json({ error: 'Invalid or expired voucher code' })
  res.json({ voucher })
})

// ─── GET /api/bookings ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const bookings = await getBookingsByUser(req.userId)
    res.json({ bookings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/bookings ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    providerId, providerName, service, category,
    scheduledAt, notes, address,
    voucherCode, ratePerHour, estimatedHrs,
  } = req.body

  if (!providerId || !providerName || !service || !category || !scheduledAt || !ratePerHour) {
    return res.status(400).json({ error: 'Missing required booking fields' })
  }

  let discountSgd = 0
  if (voucherCode) {
    const voucher = validateVoucher(voucherCode)
    if (!voucher) return res.status(400).json({ error: 'Invalid voucher code' })
    discountSgd = voucher.discount
  }

  try {
    const booking = await createBooking({
      userId: req.userId,
      providerId, providerName, service, category,
      scheduledAt, notes, address,
      voucherCode, discountSgd,
      ratePerHour, estimatedHrs,
    })
    res.status(201).json({ booking })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const booking = await getBookingById(parseInt(req.params.id))
    if (!booking || booking.user_id !== req.userId) {
      return res.status(404).json({ error: 'Booking not found' })
    }
    res.json({ booking })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PATCH /api/bookings/:id/status ──────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  if (!status) return res.status(400).json({ error: 'status is required' })
  try {
    const booking = await transitionBooking(parseInt(req.params.id), req.userId, status)
    res.json({ booking })
  } catch (err) {
    const code = err.message === 'Booking not found' ? 404
      : err.message === 'Forbidden' ? 403 : 400
    res.status(code).json({ error: err.message })
  }
})

// ─── DELETE /api/bookings/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const booking = await cancelBooking(parseInt(req.params.id), req.userId)
    res.json({ booking })
  } catch (err) {
    const code = err.message === 'Booking not found' ? 404
      : err.message === 'Forbidden' ? 403 : 400
    res.status(code).json({ error: err.message })
  }
})

export default router
