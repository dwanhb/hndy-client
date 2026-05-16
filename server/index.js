import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v2 as cloudinary } from 'cloudinary';
import { providers } from './data/providers.js';
import { matchProviders } from './utils/providerMatching.js';
import authRouter from './routes/auth.js';
import bookingsRouter from './routes/bookings.js';
import { initAuthSchema } from './db/auth.js';
import { initBookingsSchema } from './db/bookings.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Support multiple allowed origins via comma-separated CLIENT_URLS env var.
// Falls back to localhost for local dev.
const rawOrigins = process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:8001';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ─── Configure Cloudinary ─────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Configure Gemini ─────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRouter);
app.use('/api/bookings', bookingsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Cloudinary public config ─────────────────────────────────────────────────
app.get('/api/cloudinary-config', (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return res.json({ configured: false });
  }
  res.json({
    configured:   true,
    cloudName:    process.env.CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'hndy_unsigned',
  });
});

// ─── Cloudinary signed upload ─────────────────────────────────────────────────
app.get('/api/cloudinary-signature', (req, res) => {
  if (!process.env.CLOUDINARY_API_SECRET) {
    return res.status(503).json({ error: 'Cloudinary not configured' });
  }
  const timestamp = Math.round(Date.now() / 1000);
  const folder    = 'hndy-uploads';
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    signature, timestamp, folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey:    process.env.CLOUDINARY_API_KEY,
  });
});

// ─── AI Analysis ──────────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { problemText, mediaUrls = [], userLat, userLng } = req.body;

  if (!problemText || problemText.trim().length < 5) {
    return res.status(400).json({ error: 'Problem description is too short.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    const result = matchProviders(problemText, null, userLat, userLng);
    return res.json({
      rephrased:             `${result.category.toLowerCase()} issue: ${problemText}`,
      category:              result.category,
      urgency:               'medium',
      deviceInfo:            null,
      needsClarification:    false,
      clarificationQuestion: null,
      providers:             result.providers.slice(0, 8),
    });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite',
    });

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

    const result  = await model.generateContent(prompt);
    const text    = result.response.text().trim();
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed  = JSON.parse(cleaned);
    const matched = matchProviders(problemText, parsed.category, userLat, userLng);

    res.json({
      rephrased:             parsed.rephrased,
      category:              parsed.category,
      urgency:               parsed.urgency,
      deviceInfo:            parsed.deviceInfo,
      needsClarification:    parsed.needsClarification || false,
      clarificationQuestion: parsed.clarificationQuestion || null,
      providers:             matched.providers.slice(0, 8),
    });
  } catch (err) {
    console.error('Gemini error:', err.message);
    const result = matchProviders(problemText, null, userLat, userLng);
    res.json({
      rephrased:             `A ${result.category.toLowerCase()} issue has been reported: ${problemText.slice(0, 100)}`,
      category:              result.category,
      urgency:               'medium',
      deviceInfo:            null,
      needsClarification:    false,
      clarificationQuestion: null,
      providers:             result.providers.slice(0, 8),
    });
  }
});

// ─── Providers ────────────────────────────────────────────────────────────────
app.get('/api/providers', (req, res) => {
  const { category, query } = req.query;
  if (query)    return res.json(matchProviders(query, category || null).providers);
  if (category) return res.json(providers.filter(p => p.category === category));
  res.json(providers);
});

// ─── Bootstrap DB schema then start listening ─────────────────────────────────
async function start() {
  try {
    console.log('Initialising database schema…');
    await initAuthSchema();
    await initBookingsSchema();
    console.log('Database schema ready.');
  } catch (err) {
    console.error('DB init failed:', err.message);
    // Non-fatal in dev (SQLite fallback not available, but we log and continue)
  }

  app.listen(PORT, () => {
    console.log(`HNDY server running on http://localhost:${PORT}`);
    console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  });
}

start();
