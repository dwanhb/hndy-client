import { useState, useRef } from 'react'
import { Wrench, Droplet, Zap, Hammer, Paintbrush, Home, Calendar, MessageCircle, User, Send, Paperclip, MapPin, Star, DollarSign, Clock, Mic, Camera, Leaf } from 'lucide-react'
import { matchProviders } from './utils/providerMatching'
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('home')
  const [selectedService, setSelectedService] = useState(null)
  const [selectedSpecificService, setSelectedSpecificService] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [matchedProviders, setMatchedProviders] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
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
  const fileInputRef = useRef(null)

  const services = [
    { id: 'plumbing', name: 'Plumbing', icon: Droplet, color: '#3B82F6' },
    { id: 'electrical', name: 'Electrical', icon: Zap, color: '#EAB308' },
    { id: 'hvac', name: 'HVAC', icon: Wrench, color: '#10B981' },
    { id: 'carpentry', name: 'Carpentry', icon: Hammer, color: '#F97316' },
    { id: 'painting', name: 'Painting', icon: Paintbrush, color: '#A855F7' },
    { id: 'gardening', name: 'Gardening', icon: Paintbrush, color: '#22C55E' },
  ]

  const handleServiceClick = (service) => {
    setSelectedService(service)
    setCurrentScreen('service-selection')
  }

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

  const handleSpecificServiceClick = (specificService) => {
    setSelectedSpecificService(specificService)
    // Match providers based on selected service
    const providers = matchProviders(selectedService.id, `${specificService.name} service needed`)
    setMatchedProviders(providers)
    setCurrentScreen('map-providers')
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    setUploadedFiles(prev => [...prev, ...files])
    setChatMessages(prev => [...prev, {
      type: 'user',
      text: `Uploaded ${files.length} file(s): ${files.map(f => f.name).join(', ')}`
    }])
  }

  // AI-powered function to rephrase and demonstrate understanding
  const rephraseProblemWithAI = async (problemText, category) => {
    try {
      const prompt = `You are an AI assistant for a home services platform. A customer described their problem as: "${problemText}"

Rephrase this problem in clear, professional, and concise terms (maximum 15 words) to demonstrate you understood their issue. The rephrased version should:
- Be specific and accurate
- Use professional terminology
- Mention the type of service needed (${category})
- Start with lowercase (it will be inserted after "I understand you need help with")

Respond with ONLY the rephrased problem, nothing else.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || 'sk-proj-demo'}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 50
        })
      })

      if (!response.ok) {
        throw new Error('AI API failed')
      }

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error('AI rephrasing failed:', error)
      // Fallback to simple rephrasing
      return `${category.toLowerCase()} issue: "${problemText}"`
    }
  }

  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const problemText = userInput

    // Add user message
    setChatMessages(prev => [...prev, { type: 'user', text: problemText }])

    // Match providers
    const result = matchProviders(problemText)
    setMatchedProviders(result)

    // Clear input immediately
    setUserInput('')

    // Add loading message
    setChatMessages(prev => [...prev, {
      type: 'bot',
      text: 'Analyzing your problem...',
      isLoading: true
    }])

    // Rephrase problem using AI
    const rephrased = await rephraseProblemWithAI(problemText, result.category)

    // Remove loading message and add actual response
    setChatMessages(prev => {
      const filtered = prev.filter(msg => !msg.isLoading)
      return [...filtered, {
        type: 'bot',
        text: `I understand you need help with ${rephrased}. Is this correct?`,
        showConfirmation: true,
        problemText: problemText
      }]
    })
  }

  const handleConfirmProblem = () => {
    // Navigate to map view with matched providers
    setCurrentScreen('map')
  }

  const handleEditProblem = (problemText) => {
    // Allow user to edit their problem description
    setUserInput(problemText)
    // Clear the confirmation message
    setChatMessages(prev => prev.filter(msg => !msg.showConfirmation))
  }

  const handleViewAllProviders = () => {
    setCurrentScreen('providers')
  }

  const handleSelectProvider = (provider) => {
    setSelectedProvider(provider)
    setCurrentScreen('booking')
  }

  const handleBooking = () => {
    alert(`Booking confirmed with ${selectedProvider.name}!\\nDate: ${bookingData.date}\\nTime: ${bookingData.time}`)
    setCurrentScreen('home')
    // Reset
    setSelectedService(null)
    setChatMessages([])
    setMatchedProviders(null)
    setSelectedProvider(null)
    setBookingData({ date: '', time: '', notes: '' })
    setUploadedFiles([])
  }

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
        {/* HOME SCREEN */}
        {currentScreen === 'home' && (
          <>
            <div className="need-hand-card">
              <h2>AI Assistant</h2>
              
              {/* AI ASSISTANT INSIDE CARD */}
              <div className="ai-assistant-inline">
                {chatMessages.length > 0 && (
                  <div className="chat-inline">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`chat-message-inline ${msg.type}`}>
                        {msg.type === 'bot' && <span className="bot-icon">🤖</span>}
                        <p>{msg.text}</p>
                        {msg.showConfirmation && (
                          <div className="confirmation-buttons">
                            <button className="confirm-yes-btn" onClick={handleConfirmProblem}>
                              ✓ Yes, that's correct
                            </button>
                            <button className="confirm-edit-btn" onClick={() => handleEditProblem(msg.problemText)}>
                              ✏️ Edit
                            </button>
                          </div>
                        )}
                        {msg.showProvidersButton && (
                          <button className="view-all-btn" onClick={handleViewAllProviders}>
                            Show Me Providers
                          </button>
                        )}
                        {msg.providers && (
                          <div className="providers-inline">
                            {msg.providers.map((p, i) => (
                              <div key={i} className="provider-mini">
                                <strong>{p.name}</strong> - {p.rating}★ • ₱{p.hourlyRate}/hr
                              </div>
                            ))}
                            <button className="view-all-btn" onClick={handleViewAllProviders}>
                              View All {matchedProviders?.providers.length} Providers
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Clickable text area that becomes input */}
                <div className="ai-input-area">
                  <textarea
                    className="ai-textarea"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    placeholder="Tell me what you need - I'll find the perfect pro!"
                    rows="2"
                  />
                </div>
                
                {/* Bottom action buttons */}
                <div className="ai-action-buttons">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,video/*,audio/*"
                    style={{ display: 'none' }}
                  />
                  <button className="ai-action-btn" onClick={() => document.querySelector('.ai-textarea')?.focus()}>
                    <MessageCircle size={20} />
                    <span>Text</span>
                  </button>
                  <button className="ai-action-btn">
                    <Mic size={20} />
                    <span>Voice</span>
                  </button>
                  <button className="ai-action-btn" onClick={() => fileInputRef.current?.click()}>
                    <Camera size={20} />
                    <span>Photo</span>
                  </button>
                  <button className="ai-send-btn" onClick={handleSendMessage}>
                    <Send size={22} />
                  </button>
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files">
                    {uploadedFiles.map((f, i) => (
                      <span key={i} className="file-tag">📎 {f.name}</span>
                    ))}
                  </div>
                )}
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
          </>
        )}

        {/* SERVICE SELECTION SCREEN */}
        {currentScreen === 'service-selection' && selectedService && (
          <div className="service-selection-screen">
            <button className="back-button" onClick={() => setCurrentScreen('home')}>
              ← Back
            </button>

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
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MAP & PROVIDERS SCREEN */}
        {currentScreen === 'map-providers' && matchedProviders && (
          <div className="map-providers-screen">
            <button className="back-button" onClick={() => setCurrentScreen('service-selection')}>
              ← Back
            </button>

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
              <span className="sort-label">Sort by: Distance</span>
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

        {/* AI ASSISTANT SCREEN */}
        {currentScreen === 'ai-assistant' && (
          <div className="ai-screen">
            <button className="back-button" onClick={() => setCurrentScreen('home')}>
              ← Back
            </button>

            <div className="ai-header">
              <h2>{selectedService?.name} Assistant</h2>
              <p>Describe your problem and upload media files</p>
            </div>

            <div className="chat-container">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.type}`}>
                  {msg.type === 'bot' && <div className="bot-avatar">🤖</div>}
                  <div className="message-content">
                    <p>{msg.text}</p>
                    {msg.providers && (
                      <div className="provider-preview">
                        {msg.providers.map(provider => (
                          <div key={provider.id} className="provider-mini-card" onClick={() => handleSelectProvider(provider)}>
                            <div className="provider-avatar-small">{provider.avatar}</div>
                            <div>
                              <h4>{provider.name}</h4>
                              <p><Star size={12} color="#EAB308" fill="#EAB308" /> {provider.rating} • ₱{provider.hourlyRate}/hr</p>
                            </div>
                          </div>
                        ))}
                        <button className="view-all-btn" onClick={handleViewAllProviders}>
                          View All {matchedProviders?.providers.length} Providers
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {uploadedFiles.length > 0 && (
              <div className="uploaded-files">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="file-chip">
                    📎 {file.name}
                  </div>
                ))}
              </div>
            )}

            <div className="chat-input-container">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,video/*,audio/*"
                multiple
                style={{ display: 'none' }}
              />
              <button className="attach-btn" onClick={() => fileInputRef.current?.click()}>
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                className="chat-input"
                placeholder="Describe your problem..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="send-btn" onClick={handleSendMessage}>
                <Send size={20} />
              </button>
            </div>
          </div>
        )}

        {/* PROVIDERS LIST SCREEN */}
        {currentScreen === 'providers' && matchedProviders && (
          <div className="providers-screen">
            <button className="back-button" onClick={() => setCurrentScreen('ai-assistant')}>
              ← Back
            </button>

            <h2>{matchedProviders.category} Providers</h2>
            <p className="subtitle">{matchedProviders.providers.length} professionals found</p>

            <div className="map-view">
              <MapPin size={20} color="#DC2626" />
              <span>Your Location</span>
            </div>

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
                    {provider.relevanceScore > 10 && (
                      <span className="match-badge">Top Match</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAP VIEW SCREEN (from AI Assistant) */}
        {currentScreen === 'map' && matchedProviders && (
          <div className="map-screen">
            <button className="back-button" onClick={() => setCurrentScreen('home')}>
              ← Back
            </button>

            <h2>{matchedProviders.category} Providers Near You</h2>
            <p className="subtitle">{matchedProviders.providers.length} professionals found</p>

            {/* Interactive Map */}
            <div className="map-container-interactive">
              <div className="map-view-full">
                {/* User Location */}
                <div className="user-location-marker">
                  <MapPin size={32} color="#DC2626" fill="#DC2626" />
                  <div className="location-label">You are here</div>
                </div>
                
                {/* Provider Markers */}
                {matchedProviders.providers.slice(0, 8).map((provider, i) => (
                  <div 
                    key={provider.id} 
                    className={`provider-marker marker-${i}`}
                    onClick={() => handleSelectProvider(provider)}
                  >
                    <MapPin size={24} color="#2563EB" fill="#2563EB" />
                    <div className="provider-marker-label">
                      <strong>{provider.name}</strong>
                      <span>{(Math.random() * 3 + 0.5).toFixed(1)} km</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Provider List Below Map */}
            <div className="map-providers-list">
              <h3>Tap a pin to view details</h3>
              {matchedProviders.providers.map(provider => (
                <div 
                  key={provider.id} 
                  className="map-provider-card"
                  onClick={() => handleSelectProvider(provider)}
                >
                  <div className="provider-avatar-small">{provider.avatar}</div>
                  <div className="provider-info-compact">
                    <h4>{provider.name}</h4>
                    <div className="provider-stats">
                      <span><Star size={12} color="#EAB308" fill="#EAB308" /> {provider.rating}</span>
                      <span>• {(Math.random() * 3 + 0.5).toFixed(1)} km away</span>
                      <span>• ₱{provider.hourlyRate}/hr</span>
                    </div>
                  </div>
                  <button className="view-profile-btn">View</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOOKING SCREEN */}
        {currentScreen === 'booking' && selectedProvider && (
          <div className="booking-screen">
            <button className="back-button" onClick={() => setCurrentScreen('providers')}>
              ← Back
            </button>

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
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Preferred Time</label>
                <input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                  placeholder="Any specific requirements or details..."
                  rows="3"
                />
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

        {/* BOOKINGS SCREEN */}
        {currentScreen === 'bookings' && (
          <div className="bookings-screen">
            <h2>Your Bookings</h2>
            
            <div className="bookings-section">
              <h3>Upcoming</h3>
              <div className="booking-card" onClick={() => {
                setSelectedChatContact({ name: 'Sarah Chen', avatar: 'SC', service: 'Toilet Repair' })
                setCurrentScreen('chat')
              }} style={{cursor: 'pointer'}}>
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
              }} style={{cursor: 'pointer'}}>
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

        {/* MESSAGES SCREEN */}
        {currentScreen === 'messages' && (
          <div className="messages-screen">
            <h2>Messages</h2>
            
            <div className="chat-list">
              <div className="chat-item" onClick={() => {
                setSelectedChatContact({ name: 'Sarah Chen', avatar: 'SC', service: 'Toilet Repair' })
                setCurrentScreen('chat')
              }} style={{cursor: 'pointer'}}>
                <div className="chat-avatar">SC</div>
                <div className="chat-info">
                  <div className="chat-header">
                    <strong>Sarah Chen</strong>
                    <span className="chat-time">10:30 AM</span>
                  </div>
                  <p className="chat-preview">I'll arrive at 10am tomorrow. Please ensure...</p>
                </div>
                <div className="unread-badge">2</div>
              </div>
              
              <div className="chat-item" onClick={() => {
                setSelectedChatContact({ name: 'John Smith', avatar: 'JS', service: 'Electrical Wiring' })
                setCurrentScreen('chat')
              }} style={{cursor: 'pointer'}}>
                <div className="chat-avatar">JS</div>
                <div className="chat-info">
                  <div className="chat-header">
                    <strong>John Smith</strong>
                    <span className="chat-time">Yesterday</span>
                  </div>
                  <p className="chat-preview">Thanks for booking! Looking forward to helping...</p>
                </div>
              </div>
              
              <div className="chat-item" onClick={() => {
                setSelectedChatContact({ name: 'Mike Rodriguez', avatar: 'MR', service: 'Drain Unclog' })
                setCurrentScreen('chat')
              }} style={{cursor: 'pointer'}}>
                <div className="chat-avatar">MR</div>
                <div className="chat-info">
                  <div className="chat-header">
                    <strong>Mike Rodriguez</strong>
                    <span className="chat-time">Nov 20</span>
                  </div>
                  <p className="chat-preview">Job completed. Thank you!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE SCREEN */}
        {currentScreen === 'profile' && (
          <div className="profile-screen">
            <div className="profile-header">
              <div className="profile-avatar-large">{profileData.name.split(' ').map(n => n[0]).join('')}</div>
              <h2>{profileData.name}</h2>
              <p>{profileData.email}</p>
              {!isEditingProfile && (
                <button className="edit-profile-btn" onClick={() => setIsEditingProfile(true)}>Edit Profile</button>
              )}
            </div>
            
            <div className="profile-section">
              <h3>Personal Information</h3>
              {isEditingProfile ? (
                <>
                  <div className="profile-field">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    />
                  </div>
                  <div className="profile-field">
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    />
                  </div>
                  <div className="profile-field">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>
                  <div className="profile-field">
                    <label>Address</label>
                    <input 
                      type="text" 
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    />
                  </div>
                  <div className="profile-actions">
                    <button className="save-btn" onClick={() => setIsEditingProfile(false)}>Save Changes</button>
                    <button className="cancel-btn" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-field">
                    <label>Phone Number</label>
                    <p>{profileData.phone}</p>
                  </div>
                  <div className="profile-field">
                    <label>Address</label>
                    <p>{profileData.address}</p>
                  </div>
                </>
              )}
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
              <div className="setting-item">
                <p>Notifications</p>
                <span>➤</span>
              </div>
              <div className="setting-item">
                <p>Privacy & Security</p>
                <span>➤</span>
              </div>
              <div className="setting-item">
                <p>Help & Support</p>
                <span>➤</span>
              </div>
            </div>
            
            <button className="logout-btn">Log Out</button>
          </div>
        )}

        {/* CHAT SCREEN */}
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
                onKeyPress={(e) => e.key === 'Enter' && setChatInput('')}
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
        <button 
          className={currentScreen === 'home' ? 'active' : ''} 
          onClick={() => setCurrentScreen('home')}
        >
          <Home size={24} />
          <span>Home</span>
        </button>
        <button 
          className={currentScreen === 'bookings' ? 'active' : ''} 
          onClick={() => setCurrentScreen('bookings')}
        >
          <Calendar size={24} />
          <span>Bookings</span>
        </button>
        <button 
          className={currentScreen === 'messages' ? 'active' : ''} 
          onClick={() => setCurrentScreen('messages')}
        >
          <MessageCircle size={24} />
          <span>Messages</span>
        </button>
        <button 
          className={currentScreen === 'profile' ? 'active' : ''} 
          onClick={() => setCurrentScreen('profile')}
        >
          <User size={24} />
          <span>Profile</span>
        </button>
      </div>

      {/* Made with Manus badge */}
      <div className="manus-badge">
        <span>⚡ Made with Manus</span>
      </div>
    </div>
  )
}

export default App
