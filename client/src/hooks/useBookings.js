import { useState, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const TOKEN_KEY = 'hndy_token'

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY)
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function useBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/bookings`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load bookings')
      setBookings(data.bookings)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createBooking = useCallback(async (bookingPayload) => {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(bookingPayload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to create booking')
    setBookings(prev => [data.booking, ...prev])
    return data.booking
  }, [])

  const cancelBooking = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to cancel booking')
    setBookings(prev => prev.map(b => b.id === id ? data.booking : b))
    return data.booking
  }, [])

  const updateStatus = useCallback(async (id, status) => {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update status')
    setBookings(prev => prev.map(b => b.id === id ? data.booking : b))
    return data.booking
  }, [])

  const validateVoucher = useCallback(async (code) => {
    const res = await fetch(`${API_BASE}/bookings/validate-voucher`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Invalid voucher')
    return data.voucher
  }, [])

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    createBooking,
    cancelBooking,
    updateStatus,
    validateVoucher,
  }
}
