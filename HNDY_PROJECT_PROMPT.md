# HNDY Project — Comprehensive Development Prompt

**Last Updated:** May 15, 2026
**Version:** 1.3
**Project Status:** Phase 2 in progress — Client App has a working full-stack monorepo with Gemini AI backend. Geolocation feature planned next.

---

## Executive Summary

HNDY is a **service marketplace platform** connecting customers with verified service providers, modeled after the Grab user experience. The platform targets Singapore as its primary market, with the Philippines as a secondary market. It consists of three separate React/Vite applications sharing a unified visual design system and mobile-first architecture.

**Primary Market:** Singapore (S$ currency, Singapore district locations)
**Secondary Market:** Philippines (₱ currency, Metro Manila locations)
**Target Users:** Customers needing home services + Service providers seeking jobs
**Core Value Proposition:** AI-powered problem diagnosis + Instant provider matching + Verified professionals

---

## Architecture Overview

### Three Applications

| App | Purpose | Primary Users |
|-----|---------|---------------|
| **Client App** | Customer-facing service booking platform | Customers seeking home services |
| **Provider App** | Service provider job management dashboard | Service professionals |
| **Teaser Website** | Marketing and waitlist collection | Prospective customers and providers |

### Technology Stack

| Layer | Client App | Provider App | Teaser Website |
|-------|-----------|-------------|----------------|
| **Frontend** | React 18 + Vite 7 | React 18 + Vite 7 | React 18 + Vite 7 |
| **Backend** | Express.js (Node.js) | None (frontend-only) | None (frontend-only) |
| **AI** | Google Gemini API (server-side) | — | — |
| **Media Storage** | Cloudinary (unsigned upload) | — | — |
| **Styling** | Inline styles + custom CSS | Inline styles | Inline styles |
| **Package Manager** | npm | npm | pnpm |
| **Build Tool** | Vite 7 | Vite 7 | Vite 7 |

### GitHub Repositories

| App | Repository |
|-----|-----------|
| Client App | `dwanhb/hndy-client` |
| Provider App | `dwanhb/hndy-provider` |
| Teaser Website | `dwanhb/hndy-teaser` |

### Client App Monorepo Layout

```
hndy-client/
├── client/                         ← React/Vite frontend (port 8001)
│   ├── src/
│   │   ├── App.jsx                 ← All screens and routing
│   │   ├── App.css                 ← All styles
│   │   ├── data/
│   │   │   └── providers.js        ← 40 mock providers (client-side copy)
│   │   └── utils/
│   │       └── providerMatching.js ← Client-side fallback matching
│   ├── vite.config.js              ← Proxy /api → localhost:3000
│   └── package.json
├── server/                         ← Express backend (port 3000)
│   ├── index.js                    ← Main server entry point
│   ├── data/
│   │   └── providers.js            ← 40 mock providers (server-side copy)
│   ├── utils/
│   │   └── providerMatching.js     ← Server-side provider ranking
│   ├── .env                        ← Local secrets (gitignored)
│   ├── .env.example                ← Template for required env vars
│   └── package.json
├── .gitignore
└── package.json                    ← Root scripts
```

### Running the Apps Locally (Manus Sandbox)

```bash
# Client App — Backend (port 3000)
cd /home/ubuntu/hndy-client/server && node index.js &

# Client App — Frontend (port 8001)
cd /home/ubuntu/hndy-client/client && npm run dev -- --port 8001 &

# Provider App (port 5173)
cd /home/ubuntu/hndy-provider && npm run dev -- --port 5173 &

# Teaser Website (port 8003)
cd /home/ubuntu/hndy-teaser && npm run dev -- --port 8003 &
```

After starting, expose the port via Manus to get a public preview URL.

> **Note:** Manus sandbox URLs change when the sandbox resets. Always re-expose ports after a reset. The sandbox should be woken up daily at 8 AM GMT+8.

### Deployment Targets

**Production (GitHub Pages — frontend only):**

| App | URL |
|-----|-----|
| Client App | `https://dwanhb.github.io/hndy-client/` |
| Provider App | `https://dwanhb.github.io/hndy-provider/` |
| Teaser Website | `https://dwanhb.github.io/hndy-teaser/` |

> The Client App backend (Express server) requires a separate host for production. Recommended: **Railway** or **Render** (free tier, deploys directly from GitHub). GitHub Pages only serves the static frontend.

---

## Environment Variables (Client App Backend)

The server reads from `server/.env`. Copy `server/.env.example` and fill in values:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
# Change model here — options: gemini-2.0-flash-lite, gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro
GEMINI_MODEL=gemini-2.0-flash-lite

# Cloudinary (media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=hndy_unsigned  # Create as "unsigned" preset in Cloudinary dashboard

# Server
PORT=3000
CLIENT_URL=http://localhost:8001
```

**Without these keys:** The app works fully using the rule-based fallback for AI analysis and local file previews (no cloud upload). Add keys when ready to activate real AI and persistent media storage.

**Gemini quota note:** The free tier has a daily request limit. If quota is exhausted, the app falls back to rule-based matching automatically. To increase quota, enable billing on the Google Cloud project associated with the API key.

---

## Visual Design System

### Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Primary Gradient | `#667eea → #764ba2` | Hero sections, CTAs, primary buttons |
| Background | `#F9FAFB` | Page backgrounds |
| Text Primary | `#1F2937` | Body text, headings |
| Text Secondary | `#6B7280` | Descriptions, secondary labels |
| Success | `#10B981` | Confirmations, completed status |
| Warning | `#F59E0B` | Alerts, pending status |
| Danger | `#EF4444` | Errors, cancellations, remove buttons |

### Design Philosophy

The visual style uses **bold color blocks and gradients** (purple gradient `#667eea → #764ba2` as the signature element), clean card-based layouts, and photos/images that make the app feel personal and relatable to the target audience. Both the Client App and Provider App must share this unified look and feel.

All navigation must be **bottom-aligned** for thumb-reach UX on mobile. The Client App UX is modeled after the **Grab client app**. The Provider App UX is modeled after the **Grab driver app**.

All apps must be **mobile-first** and **fully responsive**, adapting layout for both portrait and landscape orientations.

---

## Client App — Full Feature Specification

### Screen 1: Home (AI Assistant)

The home screen is the primary entry point. It contains the AI assistant input, service category shortcuts, and the vouchers section.

**AI Assistant Input Flow:**

The full flow from problem submission to provider selection is:

1. Customer describes their problem in natural language via the text field.
2. Customer optionally attaches photos or videos using the **Photo** button. Each uploaded file appears as a thumbnail in the input row. Each thumbnail has a **red × remove button** visible on hover/tap, allowing the customer to delete any mistakenly uploaded file before submitting.
3. Customer optionally uses **Voice** input via the Web Speech API.
4. Customer taps the send button to submit.
5. The frontend calls `POST /api/analyze` on the backend with the problem text and any uploaded media URLs.
6. The backend sends the description and image URLs to Gemini (or uses rule-based fallback if the API key is unavailable or quota is exhausted).
7. The AI returns a structured response: rephrased problem, service category, urgency level, device info (make/model/specs if mentioned), and whether clarification is needed.
8. The **Confirmation screen** displays the AI's rephrasing with category and urgency badges. The rephrasing must be a genuine demonstration of understanding — not a repetition of the user's words.
9. If the AI determines the description is too vague or the media is insufficient, it sets `needsClarification: true` and provides a specific clarification question. The customer must answer before proceeding.
10. The customer confirms ("Yes, find pros") or taps "Edit problem" to return to the input screen with their original text preserved.
11. The **Provider Map** screen loads with providers ranked by relevance to the detected category.

**Cloudinary Media Upload:**

Files are uploaded to Cloudinary using an unsigned upload preset (`hndy_unsigned`). The returned CDN URLs are sent to the backend alongside the text description so Gemini can analyze the images. If `CLOUDINARY_CLOUD_NAME` is not set, files are previewed locally only and not uploaded.

**Gemini AI Analysis:**

The backend calls Gemini with the problem description and image URLs. It returns structured JSON:

```json
{
  "rephrased": "Clear professional summary of the problem",
  "category": "Plumbing | Electrical | HVAC | Carpentry | Painting | Gardening | Automotive | Security | General",
  "urgency": "low | medium | high | emergency",
  "deviceInfo": "Brand/model/age/size of device if mentioned, otherwise null",
  "needsClarification": false,
  "clarificationQuestion": null
}
```

The `deviceInfo` field is critical — it captures make, model, and relevant specifications (e.g. aircon BTU/capacity, pipe diameter, appliance brand) to help providers prepare before arriving.

**Rule-Based Fallback (no Gemini key):**

The `providerMatching.js` utility maps keywords to categories. Key mappings:

| Category | Sample Keywords |
|----------|----------------|
| Plumbing | pipe, leak, tap, faucet, drip, drain, toilet, sink, water, flood, clog, sewage |
| Electrical | wire, outlet, circuit, breaker, power, light, switch, socket, short, voltage |
| HVAC | aircon, ac, air conditioning, hvac, heat, cool, ventilation, filter, refrigerant |
| Carpentry | door, window, cabinet, furniture, wood, hinge, lock, shelf, frame, floor |
| Painting | paint, wall, ceiling, crack, peel, stain, coat, primer, brush |
| Gardening | garden, lawn, grass, tree, plant, trim, mow, weed, soil, hedge |

**Service Category Shortcuts:**

Six quick-tap buttons below the AI input: Plumbing, Electrical, HVAC, Carpentry, Painting, Gardening. Tapping a category pre-fills the AI assistant with that service type.

**Vouchers Section (High Priority):**

Displayed below the service categories. Each voucher card shows the discount, code, validity, and a "Use" button that copies the code to the clipboard. Current mock vouchers:
- S$10 off first booking — code: `HNDY10`
- 20% off aircon services — valid until Dec 31, 2026
- Free diagnostic for electrical faults — code: `ELEC2026`

### Screen 2: Provider Map

Displays ranked providers after the AI confirmation step.

- Interactive map (Leaflet + OpenStreetMap — no API key required) with numbered markers for each provider and a "You are here" pin for the user's location.
- Providers are ranked by: category match (highest weight) + keyword overlap with the problem description + proximity to user (Haversine distance).
- Each provider card shows: avatar initials, name, star rating, distance in km, hourly rate (S$/hr), and a Book button.
- The top-ranked provider shows a "Best Match" badge.
- A "Start a new request" button resets the flow and returns to the home screen.

**Geolocation (Planned — Phase 2):**

The app will use `navigator.geolocation.getCurrentPosition()` to detect the user's location on load. If permission is denied, it defaults to central Singapore (1.3521, 103.8198). Provider distances are calculated using the Haversine formula (pure JS, no API). Provider mock data coordinates must use Singapore district locations (Orchard, Tampines, Jurong, Woodlands, Buona Vista, etc.).

### Screen 3: Bookings

List of past and upcoming bookings with the following details per booking: service type, provider name, date/time, status badge, and amount (S$). Actions available: Cancel, Reschedule, Rate provider. Status types: Pending, Confirmed, In Progress, Completed, Cancelled.

### Screen 4: Messages

Grab-like chat interface. The conversation list shows provider photo, name, last message preview, timestamp, and unread badge count. The chat screen shows message bubbles with timestamps, quick reply buttons, and a typing indicator. Both clients and providers can send text, images, and videos within a conversation to facilitate better job assessment.

### Screen 5: Profile

User info (name, phone, email, address) with edit capability. Sections: Service Preferences, Payment Methods, Notifications, Privacy, Account Security.

### Bottom Navigation

Four tabs: **Home** (AI assistant + categories + vouchers), **Bookings**, **Messages**, **Profile**. Navigation must be bottom-aligned for thumb-reach UX.

---

## Provider App — Full Feature Specification

The Provider App UX is modeled after the **Grab driver app**. It must include a mandatory profile setup flow on first launch where providers enter their details, complete verification, and set up payment information before they can accept jobs.

### Mandatory Profile Setup (First Launch)

A step-by-step onboarding flow that must be completed before accessing the dashboard:

1. **Personal Info** — Name, phone, email, profile photo
2. **Professional Details** — Service specialties (multi-select), years of experience, certifications, service areas (districts)
3. **Verification** — Upload ID document and proof of qualifications
4. **Payment Setup** — Bank account details or PayNow/PayLah (Singapore), GCash/bank transfer (Philippines)

### Screen 1: Dashboard

Stats overview: total earnings (S$), completed jobs this month, average rating, average response time. Performance trends with percentage change indicators. Quick action buttons: Go Online/Offline toggle, View New Jobs, View Messages.

### Screen 2: Jobs

Two tabs: **Active Jobs** (current and upcoming) and **Job History** (past jobs). Each job card shows: client name, service type, date/time, location, status, and amount. Actions: Accept, Decline, Start, Complete, Message Client. The schedule view includes a map showing job location markers and a navigation view with turn-by-turn directions.

### Screen 3: Messages

Grab-like chat interface identical in structure to the Client App. Providers can send and receive text, images, and videos. Voice call option available for quick clarification.

### Screen 4: Profile

Professional info: name, phone, email, service specialties, years of experience, certifications, availability (working hours, days, on/off toggle), payment info, withdrawal history, ratings and reviews received.

### Bottom Navigation

Four tabs: **Dashboard**, **Jobs**, **Messages**, **Profile**. Navigation must be bottom-aligned for thumb-reach UX.

---

## Teaser Website — Feature Specification

1. **Navigation Bar** — Logo, menu items (Features, How It Works, For Providers), "Join Waitlist" CTA, hamburger menu on mobile
2. **Hero Section** — Headline, subheadline, customer photo, dual CTAs (customer + provider waitlist)
3. **Features Section** — Four key platform features with icons
4. **How It Works** — Step-by-step customer journey
5. **For Providers Section** — Provider benefits with photo
6. **Waitlist Forms** — Separate forms for customers and providers, email capture

---

## Mock Data Guidelines

### Provider Data (40 providers)

Providers should use realistic Singapore names and be distributed across Singapore districts. Ratings: 4.5–5.0 stars. Reviews: 50–500+. Services: distributed across 6 categories. Hourly rates: S$40–S$120/hr range. Coordinates must use Singapore district lat/lng values.

### Customer/Booking Data

Realistic Singapore names. Service variety. Recent and upcoming dates. Amounts: S$80–S$800 range. Mix of completed, scheduled, and pending statuses.

---

## Development Roadmap

### Phase 1 — MVP (Complete)

Three functional applications with unified visual design, mock data and UI for all screens, GitHub Pages deployment.

### Phase 2 — Backend Integration (In Progress)

| Item | Status |
|------|--------|
| Express.js backend for Client App | Done |
| Gemini AI integration (server-side, rule-based fallback) | Done |
| Configurable Gemini model via `GEMINI_MODEL` env var | Done |
| Cloudinary media upload (unsigned preset) | Done |
| Media remove button (× per thumbnail) | Done |
| Expanded keyword matching (tap, drip, faucet, etc.) | Done |
| Geolocation (browser GPS + Haversine distance sorting) | Planned |
| Singapore provider coordinates | Planned |
| Leaflet map integration | Planned |
| Real user authentication | Planned |
| Real booking system with database | Planned |
| Real messaging with WebSockets | Planned |
| Payment integration (Stripe / PayNow) | Planned |
| Backend for Provider App | Planned |

### Phase 3 — Advanced Features

Push notifications, video calls, provider verification system, review and rating system, real-time job tracking.

### Phase 4 — Scale and Optimize

Performance optimization, SEO, analytics, multi-region support, additional service categories.

---

## Security Notes

### Current State

AI calls are server-side only — the Gemini API key is never exposed to the frontend. Cloudinary uses an unsigned upload preset so no secret key is needed on the frontend. All provider and booking data is mock with no real PII.

### Future Requirements

Implement JWT or session-based authentication, secure API endpoints with CORS and rate limiting, hash and salt passwords, add CSRF protection, validate and sanitize all user inputs server-side.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 26, 2025 | Initial comprehensive prompt |
| 1.1 | Apr 9, 2026 | Client App monorepo; Express+Gemini backend; Cloudinary upload; media remove button; expanded keyword matching; vouchers section |
| 1.2 | Apr 11, 2026 | Updated deployment URLs; env var reference; keyword matching table; production hosting clarification |
| 1.3 | May 15, 2026 | Market updated to Singapore primary; Gemini model configurable via env var; geolocation plan added (Leaflet + Haversine); provider coordinates to be updated to SG districts; device info field documented; clarification flow documented; Provider App mandatory profile setup added; communication features (chat + voice + media) documented; vouchers updated to SG currency; roadmap updated |

---

**This document is the authoritative baseline for all HNDY development. Refer to it at the start of every session. When resuming work, read this document first, then check the current state of the relevant repository before making any changes.**
