import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pino from 'pino';
import QRCode from 'qrcode';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';

import {
  getDb,
  getAllContacts,
  updateContact,
  deleteContact,
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTodayWishes,
} from './database.js';

import { handleIncomingMessage, loadWishedCacheFromDb } from './birthday-listener.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const AUTH_DIR = path.join(__dirname, 'auth_session');

const logger = pino({ level: 'silent' });

app.use(cors());
app.use(express.json());

// Serve frontend static files in production
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// --- State ---
let sock = null;
let connectionStatus = 'disconnected';
let qrDataUrl = null; // Base64 PNG data URL of the QR code
let retryCount = 0;
const MAX_RETRIES = 5;

// --- WhatsApp Connection ---
async function connectWhatsApp() {
  if (sock) {
    try { sock.end(); } catch (e) { /* ignore */ }
    sock = null;
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    browser: ['Birthday Agent', 'Chrome', '127.0.0.1'],
  });

  // Connection events
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // QR code received — convert to image
    if (qr) {
      try {
        qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
        connectionStatus = 'qr_ready';
        retryCount = 0;
        console.log('[WhatsApp] ✅ QR code generated! Open the dashboard to scan it.');
      } catch (err) {
        console.error('[WhatsApp] Failed to generate QR image:', err);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      qrDataUrl = null;

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        console.log('[WhatsApp] Logged out. Clearing session...');
        if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        connectionStatus = 'awaiting_setup';
        retryCount = 0;
      } else if (statusCode === DisconnectReason.restartRequired || statusCode === 515) {
        console.log('[WhatsApp] Restart required. Reconnecting...');
        setTimeout(() => connectWhatsApp(), 2000);
      } else {
        retryCount++;
        if (retryCount <= MAX_RETRIES) {
          const delay = Math.min(3000 * retryCount, 15000);
          console.log(`[WhatsApp] Disconnected (${statusCode}). Retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s...`);
          connectionStatus = 'reconnecting';
          setTimeout(() => connectWhatsApp(), delay);
        } else {
          console.log('[WhatsApp] Max retries. Use dashboard to reconnect.');
          connectionStatus = 'disconnected';
        }
      }
    } else if (connection === 'open') {
      connectionStatus = 'connected';
      qrDataUrl = null;
      retryCount = 0;
      console.log('[WhatsApp] ✅ Connected! Agent is listening.\n');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Message listener
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const message of messages) {
      await handleIncomingMessage(sock, message);
    }
  });
}

// --- API Routes ---

app.get('/api/status', (req, res) => {
  res.json({
    connection: connectionStatus,
    qr: qrDataUrl, // Base64 PNG data URL
  });
});

// Start/restart connection to get a new QR
app.post('/api/connect', async (req, res) => {
  // Clear old session for fresh QR
  if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  retryCount = 0;
  qrDataUrl = null;
  connectionStatus = 'connecting';

  try {
    await connectWhatsApp();

    // Wait for QR to be generated
    let waited = 0;
    while (!qrDataUrl && waited < 10000) {
      await new Promise(r => setTimeout(r, 300));
      waited += 300;
    }

    res.json({ success: true, qr: qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reconnect with existing session
app.post('/api/reconnect', async (req, res) => {
  retryCount = 0;
  connectionStatus = 'connecting';
  try {
    await connectWhatsApp();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Contact Routes ---
app.get('/api/contacts', (req, res) => res.json(getAllContacts()));
app.put('/api/contacts/:id', (req, res) => {
  const { name, birthday, template_id } = req.body;
  updateContact(req.params.id, { name, birthday, template_id });
  res.json({ success: true });
});
app.delete('/api/contacts/:id', (req, res) => {
  deleteContact(req.params.id);
  res.json({ success: true });
});

// --- Template Routes ---
app.get('/api/templates', (req, res) => res.json(getAllTemplates()));
app.get('/api/templates/:id', (req, res) => {
  const t = getTemplate(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});
app.post('/api/templates', (req, res) => {
  const { title, text_content } = req.body;
  if (!title || !text_content) return res.status(400).json({ error: 'Title and text_content required' });
  res.status(201).json(createTemplate(title, text_content));
});
app.put('/api/templates/:id', (req, res) => {
  const { title, text_content } = req.body;
  if (!title || !text_content) return res.status(400).json({ error: 'Title and text_content required' });
  res.json(updateTemplate(req.params.id, title, text_content));
});
app.delete('/api/templates/:id', (req, res) => {
  deleteTemplate(req.params.id);
  res.json({ success: true });
});

// --- Wish Log ---
app.get('/api/wishes/today', (req, res) => res.json(getTodayWishes()));

// --- SPA fallback (serve frontend for non-API routes) ---
if (fs.existsSync(publicDir)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// --- Bootstrap ---
async function start() {
  await getDb();
  console.log('[Database] ✅ SQLite initialized');
  loadWishedCacheFromDb();

  app.listen(PORT, () => {
    console.log(`\n🎂 Birthday Agent Backend running on http://localhost:${PORT}`);

    // Keep-alive ping to prevent free-tier platforms from sleeping
    if (process.env.RENDER_EXTERNAL_URL || process.env.RENDER) {
      const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
      setInterval(() => {
        fetch(`${url}/api/status`).catch(() => {});
      }, 10 * 60 * 1000); // Ping every 10 minutes
      console.log('[Keep-Alive] Self-ping enabled (every 10 min)');
    }

    if (fs.existsSync(path.join(AUTH_DIR, 'creds.json'))) {
      console.log('[WhatsApp] Found existing session. Reconnecting...\n');
      connectWhatsApp();
    } else {
      connectionStatus = 'awaiting_setup';
      console.log('[WhatsApp] No session found.');
      console.log('[WhatsApp] Open the dashboard -> Setup tab to scan QR.\n');
    }
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
