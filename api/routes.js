// DocuMorph API Routes
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { processDocument } from '../lib/document-processor.js';
import { createCheckoutSession, handleWebhook } from '../lib/payments.js';
import { generateJWT, verifyJWT } from '../lib/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use /tmp for serverless environments (Vercel, etc.)
    const uploadDir = process.env.VERCEL 
      ? '/tmp/uploads' 
      : path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt', '.csv', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Supported: ${allowed.join(', ')}`));
    }
  }
});

// ===== PUBLIC API =====

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', service: 'DocuMorph' });
});

// Process a document
router.post('/process', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const action = req.body.action || 'summarize';
    const options = JSON.parse(req.body.options || '{}');

    const result = await processDocument(req.file.path, action, options);

    // Clean up uploaded file
    try { fs.unlinkSync(req.file.path); } catch(e) {}

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: error.message || 'Processing failed' });
  }
});

// ===== AUTHENTICATED API =====

// Register user (demo - in production use proper auth)
router.post('/auth/register', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const token = generateJWT({ email, tier: 'free', docCount: 0 });
  res.json({ success: true, token, tier: 'free' });
});

// Get user info
router.get('/user/info', verifyJWT, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ===== PAYMENT API =====

// Create checkout session
router.post('/create-checkout', async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const session = await createCheckoutSession(priceId, successUrl, cancelUrl);
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    await handleWebhook(req);
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Process document (authenticated)
router.post('/process-auth', upload.single('document'), verifyJWT, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check tier limits
    const user = req.user;
    if (user.tier === 'free' && user.docCount >= 3) {
      try { fs.unlinkSync(req.file.path); } catch(e) {}
      return res.status(402).json({ error: 'Free limit reached. Upgrade to Pro.', upgrade: true });
    }
    if (user.tier === 'pro' && user.docCount >= 100) {
      try { fs.unlinkSync(req.file.path); } catch(e) {}
      return res.status(402).json({ error: 'Pro limit reached. Upgrade to Enterprise.', upgrade: true });
    }

    const action = req.body.action || 'summarize';
    const options = JSON.parse(req.body.options || '{}');

    const result = await processDocument(req.file.path, action, options);

    // Clean up
    try { fs.unlinkSync(req.file.path); } catch(e) {}

    res.json({
      success: true,
      data: result,
      usage: { tier: user.tier, documentsUsed: user.docCount + 1 }
    });
  } catch (error) {
    console.error('Process auth error:', error);
    res.status(500).json({ error: error.message || 'Processing failed' });
  }
});

export default router;
