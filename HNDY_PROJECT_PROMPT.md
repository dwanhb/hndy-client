# HNDY Project - Comprehensive Development Prompt

**Last Updated:** April 11, 2026  
**Version:** 1.2  
**Project Status:** MVP Complete — Three functional applications. Client App upgraded to full-stack monorepo with AI backend.

---

## 📋 Executive Summary

HNDY is a **service marketplace platform** connecting customers with verified service providers in the Philippines, similar to Grab but for home services. The platform consists of three separate React/Vite applications with a unified visual design system and mobile-first architecture.

**Market Focus:** Philippines (₱ currency, Metro Manila locations)  
**Target Users:** Customers needing services + Service providers earning opportunities  
**Core Value Proposition:** AI-powered matching + Instant booking + Verified professionals

---

## 🏗️ Architecture Overview

### Three Applications

| App | Purpose | Users | Key Features |
|-----|---------|-------|--------------|
| **Client App** | Customer-facing service booking platform | Customers seeking services | AI assistant, provider map, bookings, messaging, profile |
| **Provider App** | Service provider dashboard & job management | Service professionals | Dashboard with stats, Grab-like chat, schedule with map/navigation, profile |
| **Teaser Website** | Marketing & waitlist collection | Prospective customers & providers | Landing page, customer/provider waitlists, marketing copy |

### Technology Stack

| Layer | Client App | Provider App | Teaser Website |
|-------|-----------|-------------|----------------|
| **Frontend** | React 18 + Vite | React 18 + Vite | React 18 + Vite |
| **Backend** | Express.js (Node.js) | None (frontend-only) | None (frontend-only) |
| **AI** | Google Gemini API (server-side) | — | — |
| **Media Storage** | Cloudinary (unsigned upload) | — | — |
| **Styling** | Inline styles + custom gradients | Inline styles | Inline styles |
| **Package Manager** | npm | npm | npm |
| **Build Tool** | Vite 7 | Vite 7 | Vite 7 |

### Repository Structure

**GitHub Repositories:**
- `dwanhb/hndy-client` — Client application (monorepo: `client/` + `server/`)
- `dwanhb/hndy-provider` — Provider application
- `dwanhb/hndy-teaser` — Marketing website

### Client App Monorepo Layout

```
hndy-client/
├── client/                    ← React/Vite frontend
│   ├── src/
│   │   ├── App.jsx            ← Main app with all screens
│   │   ├── App.css            ← All styles
│   │   ├── data/
│   │   │   └── providers.js   ← 40 mock providers
│   │   └── utils/
│   │       └── providerMatching.js  ← Client-side fallback matching
│   ├── vite.config.js         ← Proxy /api → server:3000
│   └── package.json
├── server/                    ← Express backend
│   ├── index.js               ← Main server (port 3000)
│   ├── data/
│   │   └── providers.js       ← Same 40 providers (server copy)
│   ├── utils/
│   │   └── providerMatching.js ← Server-side provider ranking
│   ├── .env                   ← Local secrets (gitignored)
│   ├── .env.example           ← Template for required env vars
│   └── package.json
├── .gitignore
└── package.json               ← Root scripts
```

### Deployment Targets

**Development/Testing (Manus sandbox):**
- Client App: `https://8001-igfxinzv5lxnjgtajwi0d-0b73cd41.sg1.manus.computer/`
- Provider App: `https://5173-igfxinzv5lxnjgtajwi0d-0b73cd41.sg1.manus.computer/`
- Teaser Website: `https://8003-igfxinzv5lxnjgtajwi0d-0b73cd41.sg1.manus.computer/`

> Note: Manus sandbox URLs change when the sandbox resets. Always re-expose ports after a reset.

**Production (GitHub Pages):**
- Client App: `https://dwanhb.github.io/hndy-client/`
- Provider App: `https://dwanhb.github.io/hndy-provider/`
- Teaser Website: `https://dwanhb.github.io/hndy-teaser/`

> Note: The Client App backend (Express server) requires a separate host for production. Recommended: Railway or Render (free tier, deploys from GitHub). GitHub Pages only serves the static frontend.

---

## 🔧 Running the Apps Locally (Manus Sandbox)

### Client App (Frontend + Backend)

```bash
# Terminal 1 — Backend server (port 3000)
cd /home/ubuntu/hndy-client/server
node index.js &

# Terminal 2 — Frontend dev server (port 8001)
cd /home/ubuntu/hndy-client/client
npm run dev -- --port 8001 &
```

### Provider App

```bash
cd /home/ubuntu/hndy-provider
npm run dev -- --port 5173 &
```

### Teaser Website

```bash
cd /home/ubuntu/hndy-teaser
npm run dev -- --port 8003 &
```

After starting, expose the port via Manus to get a public preview URL.

---

## 🔐 Environment Variables (Client App Backend)

The server reads from `server/.env`. Copy `server/.env.example` and fill in values:

```env
# AI — Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Media Storage — Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_UPLOAD_PRESET=hndy_unsigned   # Create as "unsigned" preset in Cloudinary dashboard

# Server
PORT=3000
```

**Without these keys:** The app still works fully using the rule-based fallback for AI analysis and local file previews (no cloud upload). Add keys when ready to activate real AI and persistent media storage.

---

## 🎨 Visual Design System

### Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Primary Gradient | `#667eea → #764ba2` | Hero sections, CTAs, primary buttons |
| Background | `#F9FAFB` | Page backgrounds, cards |
| Text Primary | `#1F2937` | Body text, headings |
| Text Secondary | `#6B7280` | Secondary text, descriptions |
| Success | `#10B981` | Positive actions, confirmations |
| Warning | `#F59E0B` | Alerts, warnings |
| Danger | `#EF4444` | Errors, cancellations |

### Typography

- **Font Family:** System fonts (Segoe UI, Roboto, Helvetica, Arial, sans-serif)
- **Hierarchy:** Consistent heading sizes across all apps
- **Mobile First:** Responsive typography scaling

### Design Philosophy

- **Bold Gradients:** Purple gradient (#667eea → #764ba2) is the signature element
- **Color Blocks:** Distinct colored sections for visual hierarchy
- **Modern Cards:** Clean card-based layouts with subtle shadows
- **Mobile-First:** All designs optimized for mobile, then scaled up
- **Thumb-Friendly Navigation:** Bottom navigation for easy mobile access
- **Grab-like UX:** Familiar patterns from Grab app (especially Provider app)

---

## 📱 Client App (Customer-Facing)

### Key Features

#### 1. AI Assistant Screen

The AI assistant is the primary entry point for customers. The full flow is:

1. Customer describes their problem in the text field (natural language)
2. Customer optionally attaches photos or videos via the **Photo** button
3. Customer optionally uses **Voice** input (Web Speech API)
4. Customer submits via the send button
5. The frontend calls `POST /api/analyze` on the backend
6. The backend sends the description + image URLs to Gemini (or uses rule-based fallback)
7. The AI returns: rephrased problem, service category, urgency level, device info, and whether clarification is needed
8. The **Confirmation screen** shows the AI's rephrasing with category/urgency badges
9. If the AI needs more info, a clarification question appears with an answer field
10. Customer confirms ("Yes, find pros") or goes back to edit
11. The **Provider Map** screen shows ranked providers filtered by the detected category

**Media Upload (Cloudinary):**
- Customer taps Photo to select one or more images or videos
- Each file shows as a thumbnail in the input row
- Each thumbnail has a **× remove button** (visible on hover/tap) to delete it before submitting
- On submit, files are uploaded to Cloudinary using an unsigned upload preset
- The returned CDN URLs are sent to the backend along with the text description
- If `CLOUDINARY_CLOUD_NAME` is not set, files are previewed locally only (not uploaded)

**AI Analysis (Gemini):**
- The backend calls the Gemini API with the problem description and image URLs
- Returns structured JSON: `{ rephrasedProblem, category, urgency, deviceInfo, needsClarification, clarificationQuestion }`
- Urgency levels: Low, Medium, High, Emergency
- Categories: Plumbing, Electrical, HVAC, Carpentry, Painting, Gardening, General
- If `GEMINI_API_KEY` is not set, the server uses keyword-based rule matching as a fallback

**Provider Ranking:**
- Providers are scored by: category match (highest weight) + keyword overlap with the problem description + proximity
- The top 8 providers are shown on the map, ranked by score
- The "Best Match" badge is shown on the #1 result

#### 2. Service Categories

Six core services available as quick-tap buttons on the home screen:

- **Plumbing** — Pipe repairs, tap/faucet issues, leaks, drain blockages, toilet repairs
- **Electrical** — Wiring, outlets, circuit breakers, lighting, troubleshooting
- **HVAC** — Air conditioning, heating systems, ventilation, aircon cleaning
- **Carpentry** — Furniture assembly/repair, door/window repairs, custom installations
- **Painting** — Interior, exterior, touch-ups, waterproofing
- **Gardening** — Landscaping, lawn maintenance, tree trimming, garden design

Tapping a category pre-fills the AI assistant with that service type.

#### 3. Provider Map

- Displays 40 mock service providers as numbered markers on an interactive CSS map
- Providers are ranked by relevance to the detected problem category
- Each provider card shows: avatar initials, name, rating (stars), distance (km), hourly rate (₱/hr), Book button
- "Best Match" badge on the top-ranked provider
- "Start a new request" button to reset and go back to the home screen

#### 4. Bookings Management

- List of past and upcoming bookings
- Details: service type, provider name, date/time, status, amount (₱)
- Actions: Cancel, reschedule, rate provider
- Status types: Pending, Confirmed, Completed, Cancelled

#### 5. Messaging System

- Grab-like chat interface with conversation list
- Latest message preview per conversation
- Timestamp, provider profile picture, quick reply buttons
- Message status indicators (sent, delivered, read)

#### 6. Profile Management

- User info: name, phone, email, address
- Edit capability for profile information
- Preferences: service preferences, payment methods
- Settings: notifications, privacy, account security

#### 7. Vouchers Section

Displayed on the home screen below service categories:
- ₱100 off first booking (code: HNDY100)
- 20% off plumbing services (valid until Dec 31, 2025)
- "Use" button copies the code

#### 8. Bottom Navigation

- **Home:** AI assistant + service categories + vouchers
- **Bookings:** View all bookings
- **Messages:** Chat with providers
- **Profile:** Account settings

### UI/UX Specifications

- **Layout:** Mobile-first (375px minimum width)
- **Navigation:** Bottom tab bar (thumb-friendly)
- **Colors:** Purple gradient primary, light gray background
- **Cards:** White cards with subtle shadows
- **Buttons:** Full-width primary buttons, outlined secondary buttons
- **Icons:** Lucide React icons throughout
- **Responsive:** Scales to tablet/desktop but optimized for mobile

### Mock Data Structure

```javascript
// Provider example
{
  id: 1,
  name: "Juan Dela Cruz",
  rating: 4.8,
  reviews: 127,
  service: "Plumbing",
  distance: "2.3 km",
  price: "₱500-1500",
  photo: "provider1.jpg",
  location: { lat: 14.5995, lng: 120.9842 }
}

// Booking example
{
  id: 1,
  provider: "Juan Dela Cruz",
  service: "Toilet Repair",
  date: "Nov 26, 2025",
  time: "2:00 PM",
  status: "Completed",
  amount: "₱1,350"
}
```

---

## 🏢 Provider App (Service Provider Dashboard)

### Key Features

#### 1. Dashboard

- Stats overview: total earnings (₱), completed jobs, average rating, response time
- Performance trends: bookings trend (% change), rating consistency
- Quick actions: accept job, view messages, update schedule

#### 2. Recent Jobs Table

- Columns: client name, service type, date, status, amount
- Status types: Completed, Scheduled, Pending, Cancelled
- Actions: view details, message client, rate client

#### 3. Grab-like Chat Interface

- Conversation list with client photo, name, last message preview, timestamp, unread badge
- Chat screen with message bubbles, timestamps, quick reply buttons, typing indicator

#### 4. Schedule & Navigation

- Dual view: Map View (job location markers) and Navigation View (turn-by-turn directions)
- Job details: address, client, service, estimated travel time
- Start/Complete job buttons

#### 5. Profile Management

- Professional info: name, phone, email, service specialties, years of experience, certifications
- Availability: working hours, days available, on/off toggle
- Payment info: bank account, withdrawal history

#### 6. Bottom Navigation

- **Dashboard:** Stats and overview
- **Jobs:** Recent jobs and schedule
- **Messages:** Chat with clients
- **Profile:** Account settings

### Mock Data Structure

```javascript
// Job example
{
  id: 1,
  client: "John Doe",
  service: "Toilet Repair",
  date: "Nov 24, 2025",
  status: "Completed",
  amount: 1350,
  location: { lat: 14.5995, lng: 120.9842 }
}

// Message example
{
  id: 1,
  clientName: "Maria Santos",
  lastMessage: "Can you come tomorrow at 2 PM?",
  timestamp: "2h ago",
  unread: 2
}
```

---

## 🌐 Teaser Website (Marketing)

### Key Features

1. **Navigation Bar** — Logo, menu items (Features, How It Works, For Providers), "Join Waitlist" CTA, hamburger menu on mobile
2. **Hero Section** — Headline, subheadline, customer photo, dual CTAs (customer + provider waitlist)
3. **Features Section** — Four key platform features with icons
4. **How It Works** — Step-by-step customer journey
5. **For Providers Section** — Provider benefits with photo
6. **Waitlist Forms** — Separate forms for customers and providers, email capture

---

## 📊 Mock Data Guidelines

### Provider Data
- **40 Providers:** Realistic Filipino names
- **Ratings:** 4.5–5.0 stars
- **Reviews:** 50–500+ reviews each
- **Services:** Distributed across 6 categories
- **Locations:** Metro Manila coordinates
- **Hourly Rates:** ₱40–₱80/hr range

### Customer Data
- **Names:** Realistic Filipino names
- **Services:** Variety of service types
- **Dates:** Recent and upcoming dates
- **Amounts:** ₱500–5000 range
- **Status:** Mix of completed, scheduled, pending

---

## 🚀 Development Roadmap

### Phase 1 — MVP (Complete ✅)
- Three functional applications with unified visual design
- Mock data and UI for all screens
- GitHub deployment (Pages)

### Phase 2 — Backend Integration (In Progress 🔄)
- ✅ Express.js backend for Client App
- ✅ Gemini AI integration (server-side, with rule-based fallback)
- ✅ Cloudinary media upload (unsigned preset)
- ✅ Media remove button (per-thumbnail × button)
- [ ] Real user authentication
- [ ] Real booking system with database
- [ ] Real messaging with WebSockets
- [ ] Payment integration (Stripe/GCash)
- [ ] Backend for Provider App

### Phase 3 — Advanced Features
- [ ] Real Google Maps integration
- [ ] Push notifications
- [ ] Video calls
- [ ] Provider verification system
- [ ] Review and rating system

### Phase 4 — Scale & Optimize
- [ ] Performance optimization
- [ ] SEO improvements
- [ ] Analytics integration
- [ ] Multi-region support
- [ ] Additional service categories

---

## 🔑 Keyword Matching Reference (Provider Ranking)

The `providerMatching.js` utility maps problem keywords to service categories. Key mappings:

| Category | Keywords (sample) |
|----------|-------------------|
| Plumbing | pipe, leak, tap, faucet, drip, drain, toilet, sink, water, flood, clog, sewage |
| Electrical | wire, outlet, circuit, breaker, power, light, switch, socket, short, voltage |
| HVAC | aircon, ac, air conditioning, hvac, heat, cool, ventilation, filter, refrigerant |
| Carpentry | door, window, cabinet, furniture, wood, hinge, lock, shelf, frame, floor |
| Painting | paint, wall, ceiling, crack, peel, stain, coat, primer, brush |
| Gardening | garden, lawn, grass, tree, plant, trim, mow, weed, soil, hedge |

---

## 📝 Code Style

- **Component Structure:** Functional components with hooks
- **Styling:** Inline styles with Tailwind-like classes
- **Icons:** Lucide React for all icons
- **Colors:** Use defined color palette constants
- **Responsive:** Mobile-first approach
- **Naming:** camelCase for variables, PascalCase for components

---

## 🔐 Security Notes

### Current State
- AI calls are server-side only (API key never exposed to frontend)
- Cloudinary uses unsigned upload preset (no secret key on frontend)
- All provider/booking data is mock (no real PII)

### Future Considerations
- Implement proper authentication (JWT or session-based)
- Secure API endpoints with CORS and rate limiting
- Hash and salt passwords
- Add CSRF protection
- Validate and sanitize all user inputs

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 26, 2025 | Initial comprehensive prompt document |
| 1.1 | Apr 9, 2026 | Client App restructured to monorepo; Express+Gemini backend added; Cloudinary media upload; media remove button (× per thumbnail); expanded keyword matching; vouchers section |
| 1.2 | Apr 11, 2026 | Updated deployment URLs; added env var reference; added keyword matching table; clarified production hosting requirements for backend |

---

**This document serves as the baseline for all future HNDY development. Refer to this prompt when making changes, adding features, or onboarding new developers.**
