# Guide de Déploiement : Pastore Services

Ce guide détaille comment déployer le Backend sur **Render** (avec persistance des données) et le Frontend sur **Vercel**.

---

## 🌍 Partie 1 : Backend (Render)

Render est utilisé pour héberger l'API Node.js et la base de données SQLite.

### 1. Configuration sur Render
1.  Créez un compte sur [dashboard.render.com](https://dashboard.render.com).
2.  Cliquez sur **New +** -> **Web Service**.
3.  Connectez votre dépôt GitHub.
4.  Configurez le service :
    *   **Name** : `pastore-api`
    *   **Root Directory** : `server` (IMPORTANT)
    *   **Environment** : `Node`
    *   **Build Command** : `npm install`
    *   **Start Command** : `node index.js`
    *   **Plan** : Free (ou Starter pour la persistance disque, voir note ci-dessous).

### 2. Variables d'Environnement (Environment Variables)
Ajoutez les clés suivantes dans l'onglet **Environment** de Render :

| Clé | Valeur Exemple | Description |
|-----|----------------|-------------|
| `NODE_ENV` | `production` | Mode prod |
| `JWT_SECRET` | `votre_cle_secrete_complexe` | Sécurité Token |
| `ADMIN_EMAIL` | `votre@email.com` | Réception demandes |
| `EMAIL_SERVICE` | `gmail` | (Si Gmail utilisé) |
| `EMAIL_USER` | `votre@gmail.com` | Compte envoi |
| `EMAIL_PASS` | `mot_de_passe_app` | Mot de passe app Google |
| `FRONTEND_URL` | `https://pastore.vercel.app` | URL de votre frontend (à mettre à jour après déploiement Vercel) |
| `STORAGE_DIR` | `/var/data` | **CRITIQUE** : Chemin du disque persistant |

### 3. Persistance des Données (Disks)
⚠️ **Important** : Sur le plan Gratuit de Render, le disque est effacé à chaque redémarrage (base de données perdue).
Pour la production, il faut ajouter un **Disk** (option payante ~7$/mois sur Render) :
1.  Allez dans l'onglet **Disks**.
2.  **Mount Path** : `/var/data`
3.  **Name** : `pastore-data`
4.  Render va redémarrer le service. SQLite et les Uploads seront stockés ici.

---

## 🚀 Partie 2 : Frontend (Vercel)

Vercel est utilisé pour héberger l'interface React.

### 1. Configuration sur Vercel
1.  Créez un compte sur [vercel.com](https://vercel.com).
2.  Cliquez sur **Add New...** -> **Project**.
3.  Importez votre dépôt GitHub.
4.  Configurez le projet :
    *   **Root Directory** : Cliquez sur "Edit" et sélectionnez `client`.
    *   **Framework Preset** : Vite (détecté automatiquement).

### 2. Variables d'Environnement
Dans la section "Environment Variables" de Vercel :

| Clé | Valeur | Description |
|-----|--------|-------------|
| `VITE_API_URL` | `https://pastore-api.onrender.com/api` | URL de votre backend Render + `/api` |

### 3. Déploiement
Cliquez sur **Deploy**. Vercel va construire le site et vous donner une URL (ex: `https://pastore-services.vercel.app`).

---

## 🔄 Partie 3 : Finalisation

1.  **Mettre à jour le Backend** :
    *   Retournez sur Render > Environment.
    *   Mettez à jour `FRONTEND_URL` avec l'URL finale fournie par Vercel (ex: `https://pastore-services.vercel.app`).
    *   Sans le slash final `/`.

2.  **Test Final** :
    *   Ouvrez l'app Vercel.
    *   Tentez une inscription (vérifie la DB).
    *   Tentez un upload de photo (vérifie le dossier Uploads).

## ✅ Checklist Finale

- [ ] Render : Disque monté sur `/var/data` (si plan payant).
- [ ] Render : `STORAGE_DIR` défini à `/var/data`.
- [ ] Vercel : `VITE_API_URL` pointe bien vers `...onrender.com/api`.
- [ ] Render : `FRONTEND_URL` correspond exactement à l'URL Vercel.
- [ ] Emails : Le mot de passe application Gmail est valide.
