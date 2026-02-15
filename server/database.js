import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '../.env' });

// Gestion du chemin persistant pour Render (Disk)
const STORAGE_DIR = process.env.STORAGE_DIR || path.dirname(fileURLToPath(import.meta.url));
const DB_SOURCE = path.join(STORAGE_DIR, 'pastore.db');

const db = new sqlite3.Database(DB_SOURCE, (err) => {
  if (err) {
    console.error('Erreur ouverture DB:', err.message);
    throw err;
  } else {
    console.log(`✅ Connecté à SQLite: ${DB_SOURCE}`);
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      phone TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      category TEXT,
      description TEXT,
      booking_date TEXT,
      booking_time TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      contact_address TEXT,
      contact_zip TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS request_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT,
      filename TEXT,
      FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE
    )`);
  });
}

export default db;