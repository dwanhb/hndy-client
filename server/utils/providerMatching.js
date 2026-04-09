import { providers } from '../data/providers.js';

// Detect service category from user query
export function detectCategory(query) {
  const lowerQuery = query.toLowerCase();
  
  const categoryKeywords = {
    'Plumbing': ['plumb', 'leak', 'pipe', 'faucet', 'toilet', 'drain', 'water', 'sink', 'shower', 'bath', 'tap', 'drip', 'dripping', 'clog', 'flush', 'valve', 'sewage', 'sewer', 'hose', 'spigot', 'cistern', 'overflow'],
    'Electrical': ['electric', 'wiring', 'light', 'power', 'outlet', 'switch', 'breaker', 'panel', 'voltage', 'socket', 'circuit', 'fuse', 'bulb', 'lamp', 'fan', 'plug', 'short circuit', 'tripped'],
    'HVAC': ['ac', 'air conditioning', 'hvac', 'heating', 'cooling', 'aircon', 'split-type', 'carrier', 'temperature', 'thermostat', 'refrigerant', 'freon', 'compressor', 'duct', 'ventilation', 'heat pump', 'furnace', 'radiator'],
    'Carpentry': ['carpenter', 'wood', 'furniture', 'cabinet', 'deck', 'door', 'window', 'shelf', 'hinge', 'lock', 'frame', 'floor', 'flooring', 'tile', 'grout', 'wardrobe', 'closet'],
    'Painting': ['paint', 'color', 'wall', 'exterior', 'interior', 'refinish'],
    'Gardening': ['garden', 'lawn', 'tree', 'plant', 'landscape', 'grass', 'yard'],
    'Automotive': ['car', 'auto', 'vehicle', 'engine', 'brake', 'oil', 'tire'],
    'Security': ['security', 'camera', 'cctv', 'alarm', 'surveillance'],
    'General': ['handyman', 'repair', 'fix', 'maintenance']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      return category;
    }
  }
  
  return 'General';
}

// Extract keywords from query
function extractKeywords(query) {
  const lowerQuery = query.toLowerCase();
  // Remove common words
  const stopWords = ['my', 'the', 'is', 'are', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'a', 'an'];
  const words = lowerQuery.split(/\s+/).filter(word => !stopWords.includes(word) && word.length > 2);
  return words;
}

// Calculate relevance score for a provider
function calculateScore(provider, keywords, category) {
  let score = 0;
  
  // Category match bonus
  if (provider.category === category) {
    score += 10;
  }
  
  // Keyword matching in specialty
  const specialtyLower = provider.specialty.toLowerCase();
  keywords.forEach(keyword => {
    if (specialtyLower.includes(keyword)) {
      score += 5;
    }
  });
  
  return score;
}

// Match providers to user query
export function matchProviders(query, detectedCategory = null) {
  const category = detectedCategory || detectCategory(query);
  const keywords = extractKeywords(query);
  
  // Score all providers
  const scoredProviders = providers.map(provider => ({
    ...provider,
    relevanceScore: calculateScore(provider, keywords, category)
  }));
  
  // Sort by relevance score (desc), then rating (desc), then experience
  const sorted = scoredProviders.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return parseInt(b.experience) - parseInt(a.experience);
  });
  
  return {
    category,
    providers: sorted,
    topMatches: sorted.slice(0, 3)
  };
}
