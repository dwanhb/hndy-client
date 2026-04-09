import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v2 as cloudinary } from 'cloudinary';
import { providers } from './data/providers.js';
import { matchProviders } from './utils/providerMatching.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:8001';

// Middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Cloudinary public config endpoint ──────────────────────────────────────
// Returns public config for unsigned uploads (no secret exposed)
app.get('/api/cloudinary-config', (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return res.json({ configured: false });
  }
  res.json({
    configured: true,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'hndy_unsigned',
  });
});

// ─── Cloudinary signed upload endpoint ───────────────────────────────────────
// Returns a signed upload signature so the client can upload directly to Cloudinary
app.get('/api/cloudinary-signature', (req, res) => {
  if (!process.env.CLOUDINARY_API_SECRET) {
    return res.status(503).json({ error: 'Cloudinary not configured' });
  }
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = 'hndy-uploads';
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    signature,
    timestamp,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
});

// ─── AI Analysis endpoint ─────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { problemText, mediaUrls = [] } = req.body;

  if (!problemText || problemText.trim().length < 5) {
    return res.status(400).json({ error: 'Problem description is too short.' });
  }

  // If no Gemini key, use rule-based fallback
  if (!process.env.GEMINI_API_KEY) {
    const result = matchProviders(problemText);
    return res.json({
      rephrased: `${result.category.toLowerCase()} issue: ${problemText}`,
      category: result.category,
      urgency: 'medium',
      deviceInfo: null,
      needsClarification: false,
      clarificationQuestion: null,
      providers: result.providers.slice(0, 8),
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const mediaContext = mediaUrls.length > 0
      ? `The user has also uploaded ${mediaUrls.length} photo(s)/video(s) showing the issue.`
      : '';

    const prompt = `You are an AI assistant for HNDY, a home services platform. A customer described their problem:

"${problemText}"
${mediaContext}

Analyze this and respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "rephrased": "A clear, professional 1-2 sentence summary of the problem that demonstrates understanding. Do NOT just repeat the user's words — rephrase meaningfully.",
  "category": "One of: Plumbing, Electrical, HVAC, Carpentry, Painting, Gardening, Automotive, Security, General",
  "urgency": "One of: low, medium, high, emergency",
  "deviceInfo": "Brand/model/age of device if mentioned, otherwise null",
  "needsClarification": false,
  "clarificationQuestion": null
}

If the problem is too vague to categorize, set needsClarification to true and provide a specific clarificationQuestion.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code blocks if present
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    // Match providers based on AI-detected category and original text
    const matched = matchProviders(problemText, parsed.category);

    res.json({
      rephrased: parsed.rephrased,
      category: parsed.category,
      urgency: parsed.urgency,
      deviceInfo: parsed.deviceInfo,
      needsClarification: parsed.needsClarification || false,
      clarificationQuestion: parsed.clarificationQuestion || null,
      providers: matched.providers.slice(0, 8),
    });
  } catch (err) {
    console.error('Gemini error:', err.message);
    // Graceful fallback
    const result = matchProviders(problemText);
    res.json({
      rephrased: `A ${result.category.toLowerCase()} issue has been reported: ${problemText.slice(0, 100)}`,
      category: result.category,
      urgency: 'medium',
      deviceInfo: null,
      needsClarification: false,
      clarificationQuestion: null,
      providers: result.providers.slice(0, 8),
    });
  }
});

// ─── Providers endpoint ───────────────────────────────────────────────────────
app.get('/api/providers', (req, res) => {
  const { category, query } = req.query;
  if (query) {
    const result = matchProviders(query, category || null);
    return res.json(result.providers);
  }
  if (category) {
    return res.json(providers.filter(p => p.category === category));
  }
  res.json(providers);
});

app.listen(PORT, () => {
  console.log(`HNDY server running on http://localhost:${PORT}`);
});
