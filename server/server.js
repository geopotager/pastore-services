import express from 'express';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import multer from 'multer';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const app = express();
const PORT = 3000;
const SECRET_KEY = 'pastore_secret_key_change_me_in_prod'; // À mettre dans .env
const ADMIN_EMAIL = 'mathias.hogne@gmail.com';

// Configuration Email (Exemple avec Gmail - Nécessite un "Mot de passe d'application")
// Idéalement, utilisez des variables d'environnement (process.env.EMAIL_USER)


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Uploads Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// --- DATABASE (SQLite) ---
const db = new sqlite3.Database('./pastore.db', (err) => {
  if (err) console.error('Erreur DB:', err.message);
  else console.log('Connecté à la base de données SQLite.');
});

// Init Tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    phone TEXT
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
    status TEXT,
    created_at INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS request_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT,
    filename TEXT
  )`);
});

// --- ROUTES AUTH ---

// Inscription
app.post('/api/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).substr(2, 9);
    
    db.run(
      `INSERT INTO users (id, name, email, password, phone) VALUES (?, ?, ?, ?, ?)`,
      [id, name, email, hashedPassword, phone],
      function(err) {
        if (err) {
          return res.status(400).json({ error: "Cet email existe déjà." });
        }
        const token = jwt.sign({ id, email }, SECRET_KEY);
        res.json({ user: { id, name, email, phone }, token });
      }
    );
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Connexion
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: "Utilisateur non trouvé" });
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY);
    res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone }, token });
  });
});

// --- ROUTES SERVICES ---

// Créer une demande (avec fichiers)
app.post('/api/requests', upload.array('photos', 5), (req, res) => {
  // req.body contient les champs texte, req.files contient les fichiers
  const data = JSON.parse(req.body.data); // On envoie les données JSON dans un champ 'data'
  const requestId = Math.random().toString(36).substr(2, 9);
  const photos = req.files;

  // 1. Sauvegarde DB
  db.run(
    `INSERT INTO requests (id, user_id, category, description, booking_date, booking_time, contact_name, contact_phone, contact_address, contact_zip, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      requestId, data.userId, data.category, data.description, 
      data.booking.date, data.booking.time,
      data.contact.name, data.contact.phone, data.contact.address, data.contact.zip,
      'pending', Date.now()
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // 2. Sauvegarde Photos DB
      if (photos && photos.length > 0) {
        const placeholders = photos.map(() => '(?, ?)').join(',');
        const values = [];
        photos.forEach(p => { values.push(requestId, p.filename); });
        db.run(`INSERT INTO request_photos (request_id, filename) VALUES ${placeholders}`, values);
      }

      // 3. Envoi Email
      sendNotificationEmail(data, photos);

      res.json({ success: true, id: requestId });
    }
  );
});

// Récupérer les demandes d'un user
app.get('/api/requests', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Non autorisé" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    
    db.all(`SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC`, [decoded.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(row => ({
        id: row.id,
        category: row.category,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        booking: { date: row.booking_date, time: row.booking_time },
        contact: { name: row.contact_name, phone: row.contact_phone, address: row.contact_address, zip: row.contact_zip },
        photos: [] // Simplification pour l'affichage liste
      })));
    });
  } catch (e) {
    res.status(401).json({ error: "Token invalide" });
  }
});

app.delete('/api/requests/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM requests WHERE id = ?`, [id], function(err) {
        if(err) return res.status(500).json({error: err.message});
        res.json({success: true});
    });
});

// --- FONCTION EMAIL ---
async function sendNotificationEmail(data, files) {
  const attachments = files.map(f => ({
    filename: f.originalname,
    path: f.path
  }));

  const htmlContent = `
    <h2>Nouvelle Demande : ${data.category.toUpperCase()}</h2>
    <p><strong>Client:</strong> ${data.contact.name} (${data.contact.phone})</p>
    <p><strong>Email:</strong> ${data.contact.email}</p>
    <p><strong>Adresse:</strong> ${data.contact.address}, ${data.contact.zip}</p>
    <hr/>
    <h3>Détails</h3>
    <p>${data.description}</p>
    <p><strong>Créneau souhaité:</strong> Le ${data.booking.date} à ${data.booking.time}</p>
  `;

  try {
    // Email Admin
    await transporter.sendMail({
      from: '"Pastore App" <no-reply@pastore.be>',
      to: ADMIN_EMAIL,
      subject: `[NOUVELLE DEMANDE] ${data.category} - ${data.contact.name}`,
      html: htmlContent,
      attachments: attachments
    });

    // Email Confirmation Client
    if (data.contact.email) {
      await transporter.sendMail({
        from: '"Pastore Services" <no-reply@pastore.be>',
        to: data.contact.email,
        subject: `Confirmation de votre demande - Pastore Services`,
        html: `
          <h3>Merci ${data.contact.name} !</h3>
          <p>Nous avons bien reçu votre demande pour : <strong>${data.category}</strong>.</p>
          <p>Nous vous recontacterons très rapidement pour confirmer le rendez-vous du ${data.booking.date}.</p>
          <br/>
          <p>Cordialement,<br/>L'équipe Pastore Services</p>
        `
      });
    }
    console.log("Emails envoyés avec succès.");
  } catch (error) {
    console.error("Erreur envoi email:", error);
  }
}

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});