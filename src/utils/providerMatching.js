import { providers } from '../data/providers';

// Detect service category from user query
export function detectCategory(query) {
  const lowerQuery = query.toLowerCase();
  
  const categoryKeywords = {
    'Plumbing': ['plumb', 'leak', 'pipe', 'faucet', 'toilet', 'drain', 'water', 'sink', 'shower', 'bath'],
    'Electrical': ['electric', 'wiring', 'light', 'power', 'outlet', 'switch', 'breaker', 'panel', 'voltage'],
    'HVAC': ['ac', 'air conditioning', 'hvac', 'heating', 'cooling', 'aircon', 'split-type', 'carrier', 'temperature', 'thermostat'],
    'Carpentry': ['carpenter', 'wood', 'furniture', 'cabinet', 'deck', 'door', 'window', 'shelf'],
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
