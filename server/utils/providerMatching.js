import { providers } from '../data/providers.js';

// ── Haversine distance formula ──────────────────────────────────────────────
// Returns distance in kilometres between two lat/lng points
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Category detection ──────────────────────────────────────────────────────
export function detectCategory(query) {
  const lowerQuery = query.toLowerCase();

  const categoryKeywords = {
    Plumbing: [
      'plumb', 'leak', 'pipe', 'faucet', 'toilet', 'drain', 'water', 'sink',
      'shower', 'bath', 'tap', 'drip', 'dripping', 'clog', 'flush', 'valve',
      'sewage', 'sewer', 'hose', 'spigot', 'cistern', 'overflow', 'blockage',
      'burst', 'water heater', 'pub', 'pressure',
    ],
    Electrical: [
      'electric', 'wiring', 'light', 'power', 'outlet', 'switch', 'breaker',
      'panel', 'voltage', 'socket', 'circuit', 'fuse', 'bulb', 'lamp', 'fan',
      'plug', 'short circuit', 'tripped', 'trip', 'db box', 'distribution board',
      'ev charger', 'smart home',
    ],
    HVAC: [
      'ac', 'air conditioning', 'hvac', 'heating', 'cooling', 'aircon',
      'split-type', 'carrier', 'temperature', 'thermostat', 'refrigerant',
      'freon', 'compressor', 'duct', 'ventilation', 'heat pump', 'furnace',
      'radiator', 'not cold', 'chemical wash', 'gas top-up', 'pcb',
    ],
    Carpentry: [
      'carpenter', 'wood', 'furniture', 'cabinet', 'deck', 'door', 'window',
      'shelf', 'hinge', 'lock', 'frame', 'floor', 'flooring', 'tile', 'grout',
      'wardrobe', 'closet', 'shelving', 'partition', 'built-in',
    ],
    Painting: [
      'paint', 'color', 'colour', 'wall', 'exterior', 'interior', 'refinish',
      'waterproofing', 'touch-up', 'texture',
    ],
    Gardening: [
      'garden', 'lawn', 'tree', 'plant', 'landscape', 'grass', 'yard',
      'mowing', 'trimming', 'weeding', 'hedge',
    ],
    General: ['handyman', 'repair', 'fix', 'maintenance', 'assembly', 'mounting'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
      return category;
    }
  }

  return 'General';
}

// ── Keyword extraction ──────────────────────────────────────────────────────
function extractKeywords(query) {
  const stopWords = [
    'my', 'the', 'is', 'are', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
    'for', 'of', 'with', 'a', 'an', 'it', 'its', 'not', 'has', 'have',
    'been', 'there', 'this', 'that', 'was', 'very',
  ];
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !stopWords.includes(w) && w.length > 2);
}

// ── Scoring formula ─────────────────────────────────────────────────────────
// score = category match (100) + keyword overlap (×10) + proximity bonus (max 50)
function calculateScore(provider, keywords, category, userLat, userLng) {
  let score = 0;

  // Category match — dominant factor
  if (provider.category === category) {
    score += 100;
  }

  // Keyword overlap in specialty
  const specialtyLower = provider.specialty.toLowerCase();
  keywords.forEach((keyword) => {
    if (specialtyLower.includes(keyword)) {
      score += 10;
    }
  });

  // Proximity bonus — up to 50 points, decays by 5 per km
  if (userLat != null && userLng != null) {
    const distKm = haversineDistance(userLat, userLng, provider.lat, provider.lng);
    score += Math.max(0, 50 - distKm * 5);
  }

  return score;
}

// ── Main matching function ──────────────────────────────────────────────────
// userLat / userLng: user's GPS coordinates (optional — omit for fallback)
export function matchProviders(query, detectedCategory = null, userLat = null, userLng = null) {
  const category = detectedCategory || detectCategory(query);
  const keywords = extractKeywords(query);

  const scoredProviders = providers.map((provider) => {
    const distanceKm =
      userLat != null && userLng != null
        ? haversineDistance(userLat, userLng, provider.lat, provider.lng)
        : null;

    return {
      ...provider,
      distanceKm: distanceKm != null ? Math.round(distanceKm * 10) / 10 : null,
      distanceLabel: distanceKm != null ? `${(Math.round(distanceKm * 10) / 10).toFixed(1)} km` : null,
      relevanceScore: calculateScore(provider, keywords, category, userLat, userLng),
    };
  });

  // Sort: relevance desc → rating desc → experience desc
  const sorted = scoredProviders.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return parseInt(b.experience) - parseInt(a.experience);
  });

  return {
    category,
    providers: sorted,
    topMatches: sorted.slice(0, 5),
  };
}
