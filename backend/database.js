import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'birthday_agent.db');

let db = null;

export async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  initializeSchema();
  seedDefaultTemplates();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initializeSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT 'Unknown',
      birthday TEXT,
      last_wished_year INTEGER,
      template_id INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      text_content TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wish_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_jid TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      template_used TEXT,
      message_sent TEXT NOT NULL,
      sent_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

function seedDefaultTemplates() {
  const result = db.exec('SELECT COUNT(*) as cnt FROM templates');
  const count = result[0]?.values[0][0] || 0;

  if (count === 0) {
    db.run(
      'INSERT INTO templates (title, text_content) VALUES (?, ?)',
      [
        'Classic Warm Wishes',
        'Happy Birthday, {{name}}! 🎂🎉 Wishing you a day filled with love, laughter, and all the happiness in the world. May this year bring you everything your heart desires!',
      ]
    );
    db.run(
      'INSERT INTO templates (title, text_content) VALUES (?, ?)',
      [
        'Fun & Playful',
        "Yooo {{name}}! 🥳🎈 It's YOUR day! Time to eat too much cake, dance like nobody's watching, and celebrate being awesome. Happy Birthday legend!",
      ]
    );
    db.run(
      'INSERT INTO templates (title, text_content) VALUES (?, ?)',
      [
        'Heartfelt & Sincere',
        'Dear {{name}}, on this special day I want you to know how much you mean to everyone around you. 💛 May your birthday be as wonderful as the joy you bring to others. Happy Birthday!',
      ]
    );
    saveDb();
  }
}

// --- Helper to run SELECT queries ---
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

// --- Contact Operations ---

export function getOrCreateContact(jid, name) {
  const existing = queryOne('SELECT * FROM contacts WHERE jid = ?', [jid]);
  if (existing) {
    if (name && name !== 'Unknown' && existing.name === 'Unknown') {
      db.run('UPDATE contacts SET name = ? WHERE jid = ?', [name, jid]);
      saveDb();
      return { ...existing, name };
    }
    return existing;
  }
  db.run('INSERT INTO contacts (jid, name) VALUES (?, ?)', [jid, name || 'Unknown']);
  saveDb();
  return queryOne('SELECT * FROM contacts WHERE jid = ?', [jid]);
}

export function updateContactBirthday(jid, birthday) {
  db.run('UPDATE contacts SET birthday = ? WHERE jid = ?', [birthday, jid]);
  saveDb();
}

export function updateLastWishedYear(jid, year) {
  db.run('UPDATE contacts SET last_wished_year = ? WHERE jid = ?', [year, jid]);
  saveDb();
}

export function getAllContacts() {
  return queryAll('SELECT * FROM contacts ORDER BY name');
}

export function updateContact(id, data) {
  const fields = [];
  const values = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.birthday !== undefined) { fields.push('birthday = ?'); values.push(data.birthday); }
  if (data.template_id !== undefined) { fields.push('template_id = ?'); values.push(data.template_id); }
  if (fields.length === 0) return;
  values.push(id);
  db.run(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDb();
}

export function deleteContact(id) {
  db.run('DELETE FROM contacts WHERE id = ?', [id]);
  saveDb();
}

// --- Template Operations ---

export function getAllTemplates() {
  return queryAll('SELECT * FROM templates ORDER BY id');
}

export function getTemplate(id) {
  return queryOne('SELECT * FROM templates WHERE id = ?', [id]);
}

export function getDefaultTemplate() {
  return queryOne('SELECT * FROM templates ORDER BY id LIMIT 1');
}

export function createTemplate(title, textContent) {
  db.run('INSERT INTO templates (title, text_content) VALUES (?, ?)', [title, textContent]);
  saveDb();
  const result = db.exec('SELECT last_insert_rowid() as id');
  const newId = result[0]?.values[0][0];
  return queryOne('SELECT * FROM templates WHERE id = ?', [newId]);
}

export function updateTemplate(id, title, textContent) {
  db.run('UPDATE templates SET title = ?, text_content = ? WHERE id = ?', [title, textContent, id]);
  saveDb();
  return queryOne('SELECT * FROM templates WHERE id = ?', [id]);
}

export function deleteTemplate(id) {
  db.run('DELETE FROM templates WHERE id = ?', [id]);
  saveDb();
}

// --- Wish Log Operations ---

export function logWish(contactJid, contactName, templateUsed, messageSent) {
  db.run(
    "INSERT INTO wish_log (contact_jid, contact_name, template_used, message_sent, sent_at) VALUES (?, ?, ?, ?, datetime('now'))",
    [contactJid, contactName, templateUsed, messageSent]
  );
  saveDb();
}

export function getTodayWishes() {
  return queryAll(
    "SELECT * FROM wish_log WHERE date(sent_at) = date('now') ORDER BY sent_at DESC"
  );
}

export function getWishedContactsForYear(year) {
  return queryAll('SELECT jid, last_wished_year FROM contacts WHERE last_wished_year = ?', [year]);
}
