import {
  getOrCreateContact,
  updateContactBirthday,
  updateLastWishedYear,
  getDefaultTemplate,
  logWish,
  getWishedContactsForYear,
} from './database.js';

export const AI_SIGNATURE = '\n\n🤖 [This is Nasir\'s AI Agent Assistant]';

// In-memory cache to prevent duplicate wishes within the same year
const wishedCache = new Map();

// Birthday keyword patterns
const BIRTHDAY_PATTERNS = [
  /\bhappy\s*birthday\b/i,
  /\bhbday\b/i,
  /\bhbd\b/i,
];

export function isBirthdayMessage(text) {
  return BIRTHDAY_PATTERNS.some((pattern) => pattern.test(text));
}

function getCurrentDateMMDD() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function hasAlreadyWished(jid) {
  const year = getCurrentYear();
  const cacheKey = `${jid}-${year}`;
  return wishedCache.has(cacheKey);
}

function markAsWished(jid) {
  const year = getCurrentYear();
  const cacheKey = `${jid}-${year}`;
  wishedCache.set(cacheKey, true);
}

function buildGreetingMessage(template, contactName) {
  let message = template.text_content.replace(/\{\{name\}\}/g, contactName);
  message += AI_SIGNATURE;
  return message;
}

/**
 * Main message handler for the birthday listener.
 */
export async function handleIncomingMessage(sock, message) {
  try {
    const msg = message.message;
    if (!msg) return null;

    const textContent =
      msg.conversation ||
      msg.extendedTextMessage?.text ||
      msg.imageMessage?.caption ||
      msg.videoMessage?.caption ||
      '';

    if (!textContent || !isBirthdayMessage(textContent)) return null;

    const remoteJid = message.key.remoteJid;
    const senderJid = message.key.participant || remoteJid;

    if (message.key.fromMe) return null;

    const pushName = message.pushName || 'Friend';

    if (hasAlreadyWished(senderJid)) {
      console.log(`[Birthday Agent] Already wished ${pushName} (${senderJid}) this year. Skipping.`);
      return null;
    }

    const contact = getOrCreateContact(senderJid, pushName);

    const todayMMDD = getCurrentDateMMDD();
    updateContactBirthday(senderJid, todayMMDD);

    const template = getDefaultTemplate();
    if (!template) {
      console.log('[Birthday Agent] No templates available. Skipping.');
      return null;
    }

    const greetingMessage = buildGreetingMessage(template, pushName);

    await sock.sendMessage(remoteJid, { text: greetingMessage });

    const currentYear = getCurrentYear();
    markAsWished(senderJid);
    updateLastWishedYear(senderJid, currentYear);

    logWish(senderJid, pushName, template.title, greetingMessage);

    console.log(`[Birthday Agent] ✅ Sent birthday wish to ${pushName} (${senderJid})`);

    return {
      contact: pushName,
      jid: senderJid,
      template: template.title,
      message: greetingMessage,
      time: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Birthday Agent] Error handling message:', error);
    return null;
  }
}

/**
 * Load existing wished contacts from DB into memory cache on startup
 */
export function loadWishedCacheFromDb() {
  const currentYear = getCurrentYear();
  const contacts = getWishedContactsForYear(currentYear);
  contacts.forEach((c) => {
    const cacheKey = `${c.jid}-${currentYear}`;
    wishedCache.set(cacheKey, true);
  });
  console.log(`[Birthday Agent] Loaded ${contacts.length} already-wished contacts into cache for ${currentYear}.`);
}
