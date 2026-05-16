import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createUser, getUserByEmail, getUserById, updateUser } from '../db/auth.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'hndy-dev-secret-change-in-prod'
const JWT_EXPIRES = '30d'

// ─── Middleware: verify JWT ───────────────────────────────────────────────────
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, password, phone } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }

  // Check duplicate
  const existing = getUserByEmail(email.toLowerCase())
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = createUser({ name: name.trim(), email: email.toLowerCase(), phone, passwordHash })

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
  res.status(201).json({ token, user })
})

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const userRow = getUserByEmail(email.toLowerCase())
  if (!userRow) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const valid = await bcrypt.compare(password, userRow.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const user = getUserById(userRow.id)
  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
  res.json({ token, user })
})

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const user = getUserById(req.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user })
})

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put('/profile', requireAuth, (req, res) => {
  const { name, phone, address } = req.body
  const user = updateUser(req.userId, { name, phone, address })
  res.json({ user })
})

export default router
