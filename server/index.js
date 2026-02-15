import express from 'express';
import cors from 'cors';
import multer from 'multer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import db from './database.js';

// --- CONFIGURATION ---
dotenv.config({ path: '../.env' }); // Fallback local

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret_unsafe';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// --- CHEMINS PERSISTANTS (RENDER DISK) ---
// Sur Render, on montera un disque sur /data. 
// En local, on utilise le dossier courant.
const STORAGE_DIR = process.env.STORAGE_DIR || path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');

// Création dossier uploads si inexistant
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`📂 Dossier uploads créé : ${UPLOADS_DIR}`);
}

// --- MIDDLEWARES ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('combined')); // Logs format production

// Configuration CORS Production
const allowedOrigins = [
  process.env.FRONTEND_URL, // L'URL Vercel (ex: https://pastore-app.vercel.app)
  'http://localhost:5173',  // Dev Local
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (ex: Postman, scripts Node) ou si l'origine est dans la liste
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS Bloqué:", origin);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Rate Limiting
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 20, 
    message: { error: "Trop de tentatives, veuillez réessayer plus tard." }
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/forgot-password', authLimiter);

// --- SERVIR FICHIERS STATIQUES ---
// On sert les fichiers depuis le dossier persistant
app.use('/uploads', express.static(UPLOADS_DIR));

// Config Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    cb(null, Date.now() + '-' + safeName);
  }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Seules les images sont autorisées.'));
    }
});

// --- EMAIL ---
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Authentification requise" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Session expirée" });
    req.user = user;
    next();
  });
};

// --- ROUTES ---

// 1. Inscription
app.post('/api/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if(!name || !email || !password || !phone) return res.status(400).json({error: "Tout les champs sont requis."});

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: "Format email invalide." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).substr(2, 9);
    
    db.run(
      `INSERT INTO users (id, name, email, password, phone) VALUES (?, ?, ?, ?, ?)`,
      [id, name, email.toLowerCase(), hashedPassword, phone],
      function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: "Cet email est déjà utilisé." });
            return next(err);
        }
        const token = jwt.sign({ id, email }, SECRET_KEY, { expiresIn: '30d' });
        res.status(201).json({ user: { id, name, email, phone }, token });
      }
    );
  } catch (e) { next(e); }
});

// 2. Connexion
app.post('/api/login', (req, res, next) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({error: "Email et mot de passe requis."});

  db.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()], async (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: "Identifiants incorrects." });
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Identifiants incorrects." });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '30d' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone }, token });
  });
});

// 3. Mot de passe oublié
app.post('/api/forgot-password', async (req, res, next) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis." });

    db.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()], async (err, user) => {
        if (err) return next(err);
        if (!user) return res.json({ success: true });

        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, user.id], async (updateErr) => {
            if (updateErr) return next(updateErr);

            if (process.env.EMAIL_USER) {
                try {
                    await transporter.sendMail({
                        from: `"Pastore Security" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject: "Réinitialisation de votre mot de passe",
                        html: `<h3>Mot de passe oublié ?</h3><p>Voici votre mot de passe temporaire : <strong>${tempPassword}</strong></p>`
                    });
                } catch (mailErr) { console.error("Erreur envoi mail reset:", mailErr); }
            }
            res.json({ success: true, message: "Si le compte existe, un email a été envoyé." });
        });
    });
});

// 4. Création Demande
app.post('/api/requests', (req, res, next) => {
    upload.array('photos', 5)(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });

        try {
            if (!req.body.data) return res.status(400).json({ error: "Données manquantes." });
            
            const data = JSON.parse(req.body.data);
            const requestId = Math.random().toString(36).substr(2, 9);
            const photos = req.files || [];

            db.run(
                `INSERT INTO requests (id, user_id, category, description, booking_date, booking_time, contact_name, contact_phone, contact_address, contact_zip, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    requestId, data.userId, data.category, data.description, 
                    data.booking.date, data.booking.time,
                    data.contact.name, data.contact.phone, data.contact.address, data.contact.zip,
                    'pending', Date.now()
                ],
                function(dbErr) {
                    if (dbErr) return next(dbErr);
                    if (photos.length > 0) {
                        const placeholders = photos.map(() => '(?, ?)').join(',');
                        const values = [];
                        photos.forEach(p => { values.push(requestId, p.filename); });
                        db.run(`INSERT INTO request_photos (request_id, filename) VALUES ${placeholders}`, values);
                    }
                    sendNotificationEmail(data, photos).catch(console.error);
                    res.status(201).json({ success: true, id: requestId });
                }
            );
        } catch (parseError) { next(parseError); }
    });
});

// 5. Liste Demandes
app.get('/api/requests', authenticateToken, (req, res, next) => {
  db.all(`SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
    if (err) return next(err);
    res.json(rows.map(row => ({
      id: row.id,
      category: row.category,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      booking: { date: row.booking_date, time: row.booking_time },
      contact: { name: row.contact_name, phone: row.contact_phone, address: row.contact_address, zip: row.contact_zip },
      photos: [] 
    })));
  });
});

// 6. Suppression
app.delete('/api/requests/:id', authenticateToken, (req, res, next) => {
  db.get('SELECT user_id FROM requests WHERE id = ?', [req.params.id], (err, row) => {
      if(err) return next(err);
      if(!row) return res.status(404).json({error: "Introuvable"});
      if(row.user_id !== req.user.id) return res.status(403).json({error: "Non autorisé"});

      db.run(`DELETE FROM requests WHERE id = ?`, [req.params.id], (delErr) => {
        if(delErr) return next(delErr);
        res.json({success: true});
      });
  });
});

async function sendNotificationEmail(data, files) {
  if (!process.env.EMAIL_USER) return;
  const attachments = files.map(f => ({ filename: f.originalname, path: f.path }));
  await transporter.sendMail({
    from: `"App" <${process.env.EMAIL_USER}>`,
    to: ADMIN_EMAIL,
    subject: `[NOUVEAU] ${data.category} - ${data.contact.name}`,
    html: `<h2>Client: ${data.contact.name}</h2><p>Tel: ${data.contact.phone}</p><p>${data.description}</p>`,
    attachments
  });
  if (data.contact.email) {
      await transporter.sendMail({
          from: `"Pastore Services" <${process.env.EMAIL_USER}>`,
          to: data.contact.email,
          subject: "Demande reçue",
          html: `<p>Bonjour ${data.contact.name}, demande reçue.</p>`
      }).catch(e => console.log("Erreur mail client:", e.message)); 
  }
}

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur interne", details: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// Démarrage
app.listen(PORT, () => {
  console.log(`✅ Serveur (Prod: ${process.env.NODE_ENV}) démarré sur port ${PORT}`);
  console.log(`📂 Dossier Stockage : ${STORAGE_DIR}`);
});