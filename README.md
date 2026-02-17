# Pastore Services - Monorepo

Application Full-Stack (React + Node.js/Express) pour la gestion de services à domicile.

## Architecture

Le projet est divisé en deux parties :
- **client/** : Frontend React (Vite, TailwindCSS)
- **server/** : Backend Node.js (Express, SQLite)

## Prérequis

- Node.js (v16+)
- NPM

## Installation Rapide

1. À la racine du projet, lancez l'installation de toutes les dépendances :
   ```bash
   npm install && npm run install:all
   ```

2. Configurez les variables d'environnement :
   - Dupliquez le fichier `.env.example` en `.env` à la racine.
   - Modifiez les valeurs (notamment `EMAIL_USER` et `EMAIL_PASS` pour l'envoi d'emails).

## Lancement (Développement)

Pour lancer le **Serveur** (Port 3000) et le **Client** (Port 5173) simultanément :

```bash
npm run dev
```

- Le client est accessible sur : `http://localhost:5173`
- Les appels API `/api` sont redirigés automatiquement vers le serveur.

## Fonctionnalités Clés

- **Authentification** : JWT, hashage mots de passe (bcrypt).
- **Upload** : Gestion des photos via Multer (stockées dans `server/uploads`).
- **Emails** : 
- **Base de données** : SQLite (fichier `server/pastore.db` généré automatiquement).
- **Sécurité** : Helmet, Rate Limiting, CORS.

## Déploiement

1. Construire le frontend :
   ```bash
   npm run build
   ```
2. Le dossier `client/dist` contient les fichiers statiques à servir.
3. Configurez votre serveur web (Nginx/Apache) pour :
   - Servir `client/dist` sur `/`
   - Rediriger `/api` et `/uploads` vers `http://localhost:3000`

