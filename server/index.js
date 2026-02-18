import { sendNewRequestEmails } from "./services/emailService.js";
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import db from './database.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

// ================= STORAGE =================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_DIR = process.env.STORAGE_DIR || __dirname;
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log("📂 Dossier uploads créé :", UPLOADS_DIR);
}

// ================= MIDDLEWARES =================

app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

const allowedOrigins = [
  'https://pastore-services.vercel.app',
  'https://pastoreservices.org',
  'https://www.pastoreservices.org',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ CORS Bloqué:", origin);
      callback(new Error('Non autorisé par CORS'));
    }
  }
}));

// Rate limit auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

// ================= MULTER =================

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB max par photo
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Type de fichier non autorisé"));
    }
  }
});

// ================= AUTH =================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Token requis" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Token invalide" });
    req.user = user;
    next();
  });
};

// ================= ROUTES =================

// REGISTER
app.post('/api/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone)
      return res.status(400).json({ error: "Champs requis manquants" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    db.run(
      `INSERT INTO users (id, name, email, password, phone) VALUES (?, ?, ?, ?, ?)`,
      [id, name, email.toLowerCase(), hashedPassword, phone],
      function (err) {
        if (err) return next(err);

        const token = jwt.sign({ id, email }, SECRET_KEY, { expiresIn: '30d' });
        res.status(201).json({
          user: { id, name, email, phone },
          token
        });
      }
    );
  } catch (err) {
    next(err);
  }
});

// LOGIN
app.post('/api/login', (req, res, next) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()], async (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: "Identifiants incorrects" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Identifiants incorrects" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      SECRET_KEY,
      { expiresIn: '30d' }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      token
    });
  });
});

// CREATE REQUEST
app.post('/api/requests', upload.array('photos', 5), async (req, res, next) => {
  try {
    const data = JSON.parse(req.body.data);
    const requestId = crypto.randomUUID();

    db.run(
      `INSERT INTO requests 
      (id, user_id, category, description, booking_date, booking_time, contact_name, contact_phone, contact_address, contact_zip, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        data.userId,
        data.category,
        data.description,
        data.booking.date,
        data.booking.time,
        data.contact.name,
        data.contact.phone,
        data.contact.address,
        data.contact.zip,
        'pending',
        Date.now()
      ],
      function (err) {
        if (err) return next(err);

        // Réponse immédiate
        res.status(201).json({ success: true });

        // Email async (non bloquant)
        sendNewRequestEmails(data, req.files || []).catch(err =>
          console.error("Email async error:", err)
        );
      }
    );
  } catch (err) {
    next(err);
  }
});

// GET USER REQUESTS
app.get('/api/requests', authenticateToken, (req, res, next) => {
  db.all(
    `SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return next(err);

      res.json(rows.map(row => ({
        id: row.id,
        category: row.category,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        booking: {
          date: row.booking_date,
          time: row.booking_time
        },
        contact: {
          name: row.contact_name,
          phone: row.contact_phone,
          address: row.contact_address,
          zip: row.contact_zip
        }
      })));
    }
  );
});

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err);
  res.status(500).json({ error: "Erreur serveur interne" });
});

// ================= START =================

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur port ${PORT}`);
  console.log("📧 Emailing actif via Resend");
});
