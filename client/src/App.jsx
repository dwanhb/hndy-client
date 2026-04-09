import React, { useState, useRef, useEffect } from 'react'
import {
  Wrench, Droplet, Zap, Hammer, Paintbrush, Home, Calendar,
  MessageCircle, User, Send, Paperclip, MapPin, Star, DollarSign,
  Clock, Mic, Camera, X, Loader2, CheckCircle, AlertCircle,
  ChevronRight, Tag, Phone, Video
} from 'lucide-react'
import { matchProviders } from './utils/providerMatching'
import './App.css'

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = '/api'

// ─── Cloudinary direct upload (unsigned) ─────────────────────────────────────
async function uploadToCloudinary(file, cloudName, uploadPreset) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'hndy-uploads')

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

// ─── Urgency badge ────────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }) {
  const map = {
    low: { label: 'Low urgency', color: '#D1FAE5', text: '#065F46' },
    medium: { label: 'Medium urgency', color: '#FEF3C7', text: '#92400E' },
    high: { label: 'High urgency', color: '#FEE2E2', text: '#991B1B' },
    emergency: { label: '🚨 Emergency', color: '#FEE2E2', text: '#7F1D1D' },
  }
  const style = map[urgency] || map.medium
  return (
    <span style={{
      background: style.color, color: style.text,
      padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600
    }}>
      {style.label}
    </span>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [currentScreen, setCurrentScreen] = useState('home')
  const [selectedService, setSelectedService] = useState(null)
  const [selectedSpecificService, setSelectedSpecificService] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [matchedProviders, setMatchedProviders] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([]) // [{file, url, publicId, uploading, error}]
  const [bookingData, setBookingData] = useState({ date: '', time: '', notes: '' })
  const [selectedChatContact, setSelectedChatContact] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+63 917 123 4567',
    address: '123 Ayala Avenue, Makati City, Metro Manila'
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [clarificationAnswer, setClarificationAnswer] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [cloudinaryConfig, setCloudinaryConfig] = useState(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  // Fetch Cloudinary config on mount
  useEffect(() => {
    fetch(`${API_BASE}/cloudinary-config`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCloudinaryConfig(data) })
      .catch(() => {})
  }, [])

  const services = [
    { id: 'plumbing', name: 'Plumbing', icon: Droplet, color: '#3B82F6' },
    { id: 'electrical', name: 'Electrical', icon: Zap, color: '#EAB308' },
    { id: 'hvac', name: 'HVAC', icon: Wrench, color: '#10B981' },
    { id: 'carpentry', name: 'Carpentry', icon: Hammer, color: '#F97316' },
    { id: 'painting', name: 'Painting', icon: Paintbrush, color: '#A855F7' },
    { id: 'gardening', name: 'Gardening', icon: Paintbrush, color: '#22C55E' },
  ]

  const specificServices = {
    plumbing: [
      { id: 'toilet', name: 'Toilet Repair', price: '₱45', icon: '🚽' },
      { id: 'shower', name: 'Shower/Bath Issues', price: '₱55', icon: '🚿' },
      { id: 'drain', name: 'Drain Unclog', price: '₱35', icon: '🕳️' },
      { id: 'pipe', name: 'Pipe Installation', price: '₱75', icon: '🔧' }
    ],
    electrical: [
      { id: 'wiring', name: 'Wiring Repair', price: '₱60', icon: '⚡' },
      { id: 'outlet', name: 'Outlet Installation', price: '₱40', icon: '🔌' },
      { id: 'lighting', name: 'Lighting Fixtures', price: '₱50', icon: '💡' },
      { id: 'panel', name: 'Circuit Panel', price: '₱80', icon: '⚙️' }
    ],
    hvac: [
      { id: 'ac-repair', name: 'AC Repair', price: '₱70', icon: '❄️' },
      { id: 'ac-install', name: 'AC Installation', price: '₱150', icon: '🌬️' },
      { id: 'maintenance', name: 'Maintenance', price: '₱45', icon: '🔧' },
      { id: 'cleaning', name: 'AC Cleaning', price: '₱40', icon: '🧹' }
    ],
    carpentry: [
      { id: 'furniture', name: 'Furniture Repair', price: '₱55', icon: '🪑' },
      { id: 'cabinet', name: 'Cabinet Installation', price: '₱85', icon: '🗄️' },
      { id: 'door', name: 'Door Repair', price: '₱50', icon: '🚪' },
      { id: 'custom', name: 'Custom Woodwork', price: '₱100', icon: '🪵' }
    ],
    painting: [
      { id: 'interior', name: 'Interior Painting', price: '₱60', icon: '🏠' },
      { id: 'exterior', name: 'Exterior Painting', price: '₱70', icon: '🏡' },
      { id: 'touch-up', name: 'Touch-up Work', price: '₱35', icon: '🖌️' },
      { id: 'wallpaper', name: 'Wallpaper Install', price: '₱65', icon: '📋' }
    ],
    gardening: [
      { id: 'lawn-mowing', name: 'Lawn Mowing', price: '₱40', icon: '🌱' },
      { id: 'tree-trimming', name: 'Tree Trimming', price: '₱65', icon: '🌳' },
      { id: 'landscaping', name: 'Landscaping', price: '₱85', icon: '🏡' },
      { id: 'garden-maintenance', name: 'Garden Maintenance', price: '₱50', icon: '🌿' }
    ]
  }

  // ─── Media upload ───────────────────────────────────────────────────────────
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const newEntries = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      previewUrl: URL.createObjectURL(file),
      cloudUrl: null,
      uploading: true,
      error: null,
    }))

    setUploadedFiles(prev => [...prev, ...newEntries])

    // Upload each file
    for (const entry of newEntries) {
      try {
        let cloudUrl = null
        if (cloudinaryConfig?.cloudName && cloudinaryConfig?.uploadPreset) {
          const result = await uploadToCloudinary(entry.file, cloudinaryConfig.cloudName, cloudinaryConfig.uploadPreset)
          cloudUrl = result.secure_url
        }
        setUploadedFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, uploading: false, cloudUrl } : f
        ))
      } catch (err) {
        setUploadedFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, uploading: false, error: 'Upload failed' } : f
        ))
      }
    }

    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleRemoveFile = (id) => {
    setUploadedFiles(prev => {
      const entry = prev.find(f => f.id === id)
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl)
      return prev.filter(f => f.id !== id)
    })
  }

  // ─── Voice input ────────────────────────────────────────────────────────────
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setUserInput(prev => prev ? `${prev} ${transcript}` : transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  // ─── AI analysis ────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    const text = userInput.trim()
    if (!text) return
    if (isAnalyzing) return

    setIsAnalyzing(true)

    const mediaUrls = uploadedFiles
      .filter(f => f.cloudUrl)
      .map(f => f.cloudUrl)

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemText: text, mediaUrls }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      setAiResult({ ...data, originalText: text })
      setMatchedProviders({ category: data.category, providers: data.providers })
      setCurrentScreen('confirm')
    } catch (err) {
      // Fallback: use client-side matching
      const result = matchProviders(text)
      setAiResult({
        rephrased: `${result.category} issue: ${text}`,
        category: result.category,
        urgency: 'medium',
        deviceInfo: null,
        needsClarification: false,
        clarificationQuestion: null,
        originalText: text,
        providers: result.providers.slice(0, 8),
      })
      setMatchedProviders({ category: result.category, providers: result.providers.slice(0, 8) })
      setCurrentScreen('confirm')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleConfirmProblem = () => {
    setCurrentScreen('map')
  }

  const handleEditProblem = () => {
    setCurrentScreen('home')
  }

  const handleServiceClick = (service) => {
    setSelectedService(service)
    setCurrentScreen('service-selection')
  }

  const handleSpecificServiceClick = (specificService) => {
    setSelectedSpecificService(specificService)
    const providers = matchProviders(selectedService.id, `${specificService.name} service needed`)
    setMatchedProviders(providers)
    setCurrentScreen('map-providers')
  }

  const handleSelectProvider = (provider) => {
    setSelectedProvider(provider)
    setCurrentScreen('booking')
  }

  const handleBooking = () => {
    alert(`Booking confirmed with ${selectedProvider.name}!\nDate: ${bookingData.date}\nTime: ${bookingData.time}`)
    setCurrentScreen('home')
    setSelectedService(null)
    setMatchedProviders(null)
    setSelectedProvider(null)
    setBookingData({ date: '', time: '', notes: '' })
    setUploadedFiles([])
    setUserInput('')
    setAiResult(null)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <Wrench size={32} color="#666" />
          <div className="header-text">
            <h1>HNDY</h1>
            <p>Your handy solution, on demand</p>
          </div>
        </div>
        <div className="user-avatar">JD</div>
      </div>

      {/* Main Content */}
      <div className="main-content">

        {/* ── HOME SCREEN ─────────────────────────────────────────────────── */}
        {currentScreen === 'home' && (
          <>
            <div className="need-hand-card">
              <h2>AI Assistant</h2>

              {/* Textarea */}
              <div className="ai-input-area">
                <textarea
                  className="ai-textarea"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Tell me what you need — I'll find the perfect pro!"
                  rows="3"
                />
              </div>

              {/* Media thumbnails */}
              {uploadedFiles.length > 0 && (
                <div className="media-preview-row">
                  {uploadedFiles.map(entry => (
                    <div key={entry.id} className="media-thumb-wrapper">
                      {entry.file.type.startsWith('video/') ? (
                        <video src={entry.previewUrl} className="media-thumb" />
                      ) : (
                        <img src={entry.previewUrl} alt="upload" className="media-thumb" />
                      )}
                      {entry.uploading && (
                        <div className="media-thumb-overlay">
                          <Loader2 size={16} className="spin" />
                        </div>
                      )}
                      {entry.error && (
                        <div className="media-thumb-overlay error">
                          <AlertCircle size={16} />
                        </div>
                      )}
                      <button
                        className="media-remove-btn"
                        onClick={() => handleRemoveFile(entry.id)}
                        aria-label="Remove media"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="ai-action-buttons">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                />
                <button
                  className={`ai-action-btn ${isListening ? 'listening' : ''}`}
                  onClick={handleVoiceInput}
                >
                  <Mic size={20} />
                  <span>{isListening ? 'Stop' : 'Voice'}</span>
                </button>
                <button className="ai-action-btn" onClick={() => fileInputRef.current?.click()}>
                  <Camera size={20} />
                  <span>Photo</span>
                </button>
                <button
                  className="ai-send-btn"
                  onClick={handleSendMessage}
                  disabled={isAnalyzing || !userInput.trim()}
                >
                  {isAnalyzing
                    ? <Loader2 size={22} className="spin" />
                    : <Send size={22} />
                  }
                </button>
              </div>
            </div>

            <div className="services-section">
              <h3>SERVICES</h3>
              <div className="services-grid">
                {services.map(service => {
                  const Icon = service.icon
                  return (
                    <button
                      key={service.id}
                      className="service-card"
                      onClick={() => handleServiceClick(service)}
                    >
                      <Icon size={40} color={service.color} strokeWidth={1.5} />
                      <span>{service.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Vouchers section */}
            <div className="vouchers-section">
              <h3>VOUCHERS</h3>
              <div className="voucher-card">
                <div className="voucher-icon"><Tag size={24} color="#7C3AED" /></div>
                <div className="voucher-info">
                  <strong>₱100 off your first booking</strong>
                  <p>Use code: <span className="voucher-code">HNDY100</span></p>
                </div>
                <button className="voucher-use-btn">Use</button>
              </div>
              <div className="voucher-card">
                <div className="voucher-icon"><Tag size={24} color="#059669" /></div>
                <div className="voucher-info">
                  <strong>20% off plumbing services</strong>
                  <p>Valid until Dec 31, 2025</p>
                </div>
                <button className="voucher-use-btn">Use</button>
              </div>
            </div>
          </>
        )}

        {/* ── CONFIRM SCREEN ──────────────────────────────────────────────── */}
        {currentScreen === 'confirm' && aiResult && (
          <div className="confirm-screen">
            <div className="ai-confirm-card">
              <div className="ai-confirm-header">
                <div className="ai-avatar-circle">AI</div>
                <div>
                  <strong>Here's what I understood:</strong>
                  <p>Please confirm this is correct</p>
                </div>
              </div>

              <div className="ai-rephrased-box">
                <p>{aiResult.rephrased}</p>
              </div>

              <div className="ai-tags">
                <span className="ai-tag category">{aiResult.category}</span>
                <UrgencyBadge urgency={aiResult.urgency} />
                {aiResult.deviceInfo && (
                  <span className="ai-tag device">{aiResult.deviceInfo}</span>
                )}
              </div>

              {/* Clarification question */}
              {aiResult.needsClarification && aiResult.clarificationQuestion && (
                <div className="clarification-block">
                  <p className="clarification-q">{aiResult.clarificationQuestion}</p>
                  <textarea
                    className="clarification-input"
                    value={clarificationAnswer}
                    onChange={(e) => setClarificationAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows="2"
                  />
                </div>
              )}

              {/* Uploaded media preview in confirm step */}
              {uploadedFiles.length > 0 && (
                <div className="media-preview-row" style={{ marginTop: 12 }}>
                  {uploadedFiles.map(entry => (
                    <div key={entry.id} className="media-thumb-wrapper">
                      {entry.file.type.startsWith('video/') ? (
                        <video src={entry.previewUrl} className="media-thumb" />
                      ) : (
                        <img src={entry.previewUrl} alt="upload" className="media-thumb" />
                      )}
                      <button
                        className="media-remove-btn"
                        onClick={() => handleRemoveFile(entry.id)}
                        aria-label="Remove media"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="confirm-actions">
                <button className="confirm-edit-btn" onClick={handleEditProblem}>
                  ← Edit problem
                </button>
                <button className="confirm-yes-btn" onClick={handleConfirmProblem}>
                  Yes, find pros →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MAP SCREEN (from AI flow) ────────────────────────────────────── */}
        {currentScreen === 'map' && matchedProviders && (
          <div className="map-screen">
            <button className="back-button" onClick={() => setCurrentScreen('confirm')}>← Back</button>

            <div className="map-screen-header">
              <h2>Nearby Pros Found</h2>
              <p className="subtitle">{matchedProviders.providers.length} providers ranked by relevance</p>
              {aiResult && (
                <span className="ai-tag category" style={{ fontSize: 12 }}>{aiResult.category}</span>
              )}
            </div>

            {aiResult && (
              <div className="problem-summary-bar">
                <p>{aiResult.rephrased}</p>
              </div>
            )}

            {/* Map placeholder (replace with Google Maps embed when API key available) */}
            <div className="map-container-interactive">
              <div className="map-view-full">
                <div className="user-location-marker">
                  <MapPin size={32} color="#DC2626" fill="#DC2626" />
                  <div className="location-label">You are here</div>
                </div>
                {matchedProviders.providers.slice(0, 8).map((provider, i) => (
                  <div
                    key={provider.id}
                    className={`provider-marker marker-${i}`}
                    onClick={() => handleSelectProvider(provider)}
                  >
                    <div className="marker-number">{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="map-providers-list">
              <h3>Top matches for your problem</h3>
              {matchedProviders.providers.slice(0, 8).map((provider, i) => (
                <div
                  key={provider.id}
                  className="map-provider-card"
                  onClick={() => handleSelectProvider(provider)}
                >
                  <div className="provider-number-badge">{i + 1}</div>
                  <div className="provider-avatar-small">{provider.avatar}</div>
                  <div className="provider-info-compact">
                    <h4>
                      {provider.name}
                      {i === 0 && <span className="best-match-badge">Best Match</span>}
                    </h4>
                    <div className="provider-stats">
                      <span><Star size={12} color="#EAB308" fill="#EAB308" /> {provider.rating}</span>
                      <span>• {(Math.random() * 3 + 0.5).toFixed(1)} km</span>
                      <span>• ₱{provider.hourlyRate}/hr</span>
                    </div>
                  </div>
                  <button className="view-profile-btn" onClick={(e) => {
                    e.stopPropagation()
                    handleSelectProvider(provider)
                  }}>Book</button>
                </div>
              ))}
            </div>

            <button className="start-new-btn" onClick={() => {
              setCurrentScreen('home')
              setUserInput('')
              setUploadedFiles([])
              setAiResult(null)
              setMatchedProviders(null)
            }}>
              Start a new request
            </button>
          </div>
        )}

        {/* ── SERVICE SELECTION SCREEN ─────────────────────────────────────── */}
        {currentScreen === 'service-selection' && selectedService && (
          <div className="service-selection-screen">
            <button className="back-button" onClick={() => setCurrentScreen('home')}>← Back</button>
            <h2>{selectedService.name} Services</h2>
            <p className="subtitle">Select your {selectedService.name.toLowerCase()} need:</p>
            <div className="specific-services-list">
              {specificServices[selectedService.id]?.map(service => (
                <button
                  key={service.id}
                  className="specific-service-card"
                  onClick={() => handleSpecificServiceClick(service)}
                >
                  <div className="service-icon-large">{service.icon}</div>
                  <div className="service-info">
                    <h3>{service.name}</h3>
                    <p>Starting from {service.price}</p>
                  </div>
                  <ChevronRight size={20} color="#9CA3AF" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MAP & PROVIDERS SCREEN (from service browse) ─────────────────── */}
        {currentScreen === 'map-providers' && matchedProviders && (
          <div className="map-providers-screen">
            <button className="back-button" onClick={() => setCurrentScreen('service-selection')}>← Back</button>
            <h2>Nearby {selectedService?.name} Providers</h2>
            <p className="subtitle">{matchedProviders.providers.length} available</p>

            <div className="map-container-full">
              <div className="map-placeholder">
                <MapPin size={24} color="#DC2626" className="user-location-pin" />
                <div className="location-label">📍 Your location</div>
                <div className="available-badge">{matchedProviders.providers.length} available</div>
                {matchedProviders.providers.slice(0, 4).map((p, i) => (
                  <MapPin key={i} size={20} color="#2563eb" className={`provider-pin pin-${i}`} />
                ))}
              </div>
            </div>

            <div className="providers-header">
              <span>Available {selectedService?.name} Providers</span>
              <span className="sort-label">Sort by: Relevance</span>
            </div>

            <div className="providers-list">
              {matchedProviders.providers.map(provider => (
                <div key={provider.id} className="provider-card-full" onClick={() => handleSelectProvider(provider)}>
                  <div className="provider-avatar-large">{provider.avatar}</div>
                  <div className="provider-details">
                    <h3>{provider.name}</h3>
                    <div className="provider-meta">
                      <span><Star size={14} color="#EAB308" fill="#EAB308" /> {provider.rating} ({provider.reviews})</span>
                      <span>• 1.2 km away</span>
                    </div>
                    <p className="provider-specialty">{provider.specialty}</p>
                    <p className="availability">✅ Available now</p>
                  </div>
                  <div className="provider-rate">₱{provider.hourlyRate}/hr</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROVIDERS LIST SCREEN ────────────────────────────────────────── */}
        {currentScreen === 'providers' && matchedProviders && (
          <div className="providers-screen">
            <button className="back-button" onClick={() => setCurrentScreen('home')}>← Back</button>
            <h2>{matchedProviders.category} Providers</h2>
            <p className="subtitle">{matchedProviders.providers.length} professionals found</p>
            <div className="providers-list">
              {matchedProviders.providers.map(provider => (
                <div key={provider.id} className="provider-card-full" onClick={() => handleSelectProvider(provider)}>
                  <div className="provider-avatar-large">{provider.avatar}</div>
                  <div className="provider-details">
                    <h3>{provider.name}</h3>
                    <div className="provider-meta">
                      <span><Star size={14} color="#EAB308" fill="#EAB308" /> {provider.rating} ({provider.reviews})</span>
                      <span><DollarSign size={14} /> ₱{provider.hourlyRate}/hr</span>
                      <span><Clock size={14} /> {provider.experience}</span>
                    </div>
                    <p className="provider-specialty">{provider.specialty}</p>
                    {provider.relevanceScore > 10 && <span className="match-badge">Top Match</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BOOKING SCREEN ───────────────────────────────────────────────── */}
        {currentScreen === 'booking' && selectedProvider && (
          <div className="booking-screen">
            <button className="back-button" onClick={() => setCurrentScreen('map')}>← Back</button>

            <div className="provider-summary">
              <div className="provider-avatar-large">{selectedProvider.avatar}</div>
              <div>
                <h2>{selectedProvider.name}</h2>
                <p><Star size={16} color="#EAB308" fill="#EAB308" /> {selectedProvider.rating} • {selectedProvider.experience}</p>
                <p className="rate">₱{selectedProvider.hourlyRate}/hour</p>
              </div>
            </div>

            <div className="booking-form">
              <h3>Schedule Your Service</h3>
              <div className="form-group">
                <label>Preferred Date</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label>Preferred Time</label>
                <input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  placeholder="Any specific requirements or details..."
                  rows="3"
                />
              </div>

              {/* Voucher input */}
              <div className="form-group">
                <label>Voucher Code (optional)</label>
                <div className="voucher-input-row">
                  <input type="text" placeholder="e.g. HNDY100" />
                  <button className="apply-voucher-btn">Apply</button>
                </div>
              </div>

              <button
                className="book-btn"
                onClick={handleBooking}
                disabled={!bookingData.date || !bookingData.time}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        )}

        {/* ── BOOKINGS SCREEN ──────────────────────────────────────────────── */}
        {currentScreen === 'bookings' && (
          <div className="bookings-screen">
            <h2>Your Bookings</h2>
            <div className="bookings-section">
              <h3>Upcoming</h3>
              <div className="booking-card" onClick={() => {
                setSelectedChatContact({ name: 'Sarah Chen', avatar: 'SC', service: 'Toilet Repair' })
                setCurrentScreen('chat')
              }} style={{ cursor: 'pointer' }}>
                <div className="booking-header">
                  <div>
                    <strong>Toilet Repair</strong>
                    <p className="booking-provider">Sarah Chen • Plumbing</p>
                  </div>
                  <span className="booking-status confirmed">Confirmed</span>
                </div>
                <div className="booking-details">
                  <p>📅 Nov 26, 2025 at 10:00 AM</p>
                  <p>📍 123 Ayala Ave, Makati City</p>
                  <p>💰 ₱45/hr • Estimated 2 hours</p>
                </div>
              </div>
              <div className="booking-card" onClick={() => {
                setSelectedChatContact({ name: 'John Smith', avatar: 'JS', service: 'Electrical Wiring' })
                setCurrentScreen('chat')
              }} style={{ cursor: 'pointer' }}>
                <div className="booking-header">
                  <div>
                    <strong>Electrical Wiring</strong>
                    <p className="booking-provider">John Smith • Electrical</p>
                  </div>
                  <span className="booking-status confirmed">Confirmed</span>
                </div>
                <div className="booking-details">
                  <p>📅 Nov 28, 2025 at 2:00 PM</p>
                  <p>📍 456 Ortigas Center, Pasig</p>
                  <p>💰 ₱60/hr • Estimated 3 hours</p>
                </div>
              </div>
            </div>
            <div className="bookings-section">
              <h3>Past</h3>
              <div className="booking-card">
                <div className="booking-header">
                  <div>
                    <strong>Drain Unclog</strong>
                    <p className="booking-provider">Mike Rodriguez • Plumbing</p>
                  </div>
                  <span className="booking-status completed">Completed</span>
                </div>
                <div className="booking-details">
                  <p>📅 Nov 20, 2025 at 9:00 AM</p>
                  <p>⭐ Rated 5.0</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MESSAGES SCREEN ──────────────────────────────────────────────── */}
        {currentScreen === 'messages' && (
          <div className="messages-screen">
            <h2>Messages</h2>
            <div className="chat-list">
              {[
                { name: 'Sarah Chen', avatar: 'SC', service: 'Toilet Repair', preview: "I'll arrive at 10am tomorrow. Please ensure...", time: '10:30 AM', unread: 2 },
                { name: 'John Smith', avatar: 'JS', service: 'Electrical Wiring', preview: "Thanks for booking! Looking forward to helping...", time: 'Yesterday', unread: 0 },
                { name: 'Mike Rodriguez', avatar: 'MR', service: 'Drain Unclog', preview: "Job completed. Thank you!", time: 'Nov 20', unread: 0 },
              ].map(contact => (
                <div key={contact.name} className="chat-item" onClick={() => {
                  setSelectedChatContact(contact)
                  setCurrentScreen('chat')
                }}>
                  <div className="chat-avatar">{contact.avatar}</div>
                  <div className="chat-info">
                    <div className="chat-header">
                      <strong>{contact.name}</strong>
                      <span className="chat-time">{contact.time}</span>
                    </div>
                    <p className="chat-preview">{contact.preview}</p>
                  </div>
                  {contact.unread > 0 && <div className="unread-badge">{contact.unread}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROFILE SCREEN ───────────────────────────────────────────────── */}
        {currentScreen === 'profile' && (
          <div className="profile-screen">
            <div className="profile-header">
              <div className="profile-avatar-large">
                {profileData.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h2>{profileData.name}</h2>
              <p>{profileData.email}</p>
              {!isEditingProfile && (
                <button className="edit-profile-btn" onClick={() => setIsEditingProfile(true)}>
                  Edit Profile
                </button>
              )}
            </div>

            <div className="profile-section">
              <h3>Personal Information</h3>
              {isEditingProfile ? (
                <>
                  {['name', 'email', 'phone', 'address'].map(field => (
                    <div key={field} className="profile-field">
                      <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                      <input
                        type="text"
                        value={profileData[field]}
                        onChange={(e) => setProfileData({ ...profileData, [field]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div className="profile-actions">
                    <button className="save-btn" onClick={() => setIsEditingProfile(false)}>Save Changes</button>
                    <button className="cancel-btn" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-field"><label>Phone Number</label><p>{profileData.phone}</p></div>
                  <div className="profile-field"><label>Address</label><p>{profileData.address}</p></div>
                </>
              )}
            </div>

            <div className="profile-section">
              <h3>My Vouchers</h3>
              <div className="voucher-card">
                <div className="voucher-icon"><Tag size={20} color="#7C3AED" /></div>
                <div className="voucher-info">
                  <strong>₱100 off first booking</strong>
                  <p>Code: <span className="voucher-code">HNDY100</span></p>
                </div>
                <span className="voucher-status active">Active</span>
              </div>
            </div>

            <div className="profile-section">
              <h3>Payment Methods</h3>
              <div className="payment-method">
                <p>💳 Visa ending in 4242</p>
                <span className="default-badge">Default</span>
              </div>
              <div className="payment-method">
                <p>💳 GCash - 0917 123 4567</p>
              </div>
            </div>

            <div className="profile-section">
              <h3>Settings</h3>
              {['Notifications', 'Privacy & Security', 'Help & Support'].map(item => (
                <div key={item} className="setting-item">
                  <p>{item}</p>
                  <ChevronRight size={18} color="#9CA3AF" />
                </div>
              ))}
            </div>

            <button className="logout-btn">Log Out</button>
          </div>
        )}

        {/* ── CHAT SCREEN ──────────────────────────────────────────────────── */}
        {currentScreen === 'chat' && selectedChatContact && (
          <div className="chat-screen">
            <div className="chat-screen-header">
              <button className="back-button" onClick={() => setCurrentScreen('messages')}>← Back</button>
              <div className="chat-contact-info">
                <div className="chat-avatar-small">{selectedChatContact.avatar}</div>
                <div>
                  <h3>{selectedChatContact.name}</h3>
                  <p className="chat-service-label">{selectedChatContact.service}</p>
                </div>
                <div className="chat-call-buttons">
                  <button className="chat-call-btn"><Phone size={18} /></button>
                  <button className="chat-call-btn"><Video size={18} /></button>
                </div>
              </div>
            </div>

            <div className="chat-conversation">
              <div className="chat-message-item received">
                <p>Hi! I have a question about the {selectedChatContact.service} service.</p>
                <span className="msg-time">9:30 AM</span>
              </div>
              <div className="chat-message-item sent">
                <p>Hello! I'd be happy to help. What would you like to know?</p>
                <span className="msg-time">9:35 AM</span>
              </div>
              <div className="chat-message-item received">
                <p>I'll arrive at 10am tomorrow. Please ensure the area is accessible.</p>
                <span className="msg-time">10:30 AM</span>
              </div>
              <div className="chat-message-item sent">
                <p>Perfect! I'll make sure everything is ready. See you tomorrow!</p>
                <span className="msg-time">10:32 AM</span>
              </div>
            </div>

            <div className="chat-input-container">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setChatInput('')}
              />
              <button className="send-button-chat" onClick={() => setChatInput('')}>
                <Send size={20} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className={currentScreen === 'home' ? 'active' : ''} onClick={() => setCurrentScreen('home')}>
          <Home size={24} /><span>Home</span>
        </button>
        <button className={currentScreen === 'bookings' ? 'active' : ''} onClick={() => setCurrentScreen('bookings')}>
          <Calendar size={24} /><span>Bookings</span>
        </button>
        <button className={currentScreen === 'messages' ? 'active' : ''} onClick={() => setCurrentScreen('messages')}>
          <MessageCircle size={24} /><span>Messages</span>
        </button>
        <button className={currentScreen === 'profile' ? 'active' : ''} onClick={() => setCurrentScreen('profile')}>
          <User size={24} /><span>Profile</span>
        </button>
      </div>
    </div>
  )
}

export default App
