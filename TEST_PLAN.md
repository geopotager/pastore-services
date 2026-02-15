# Plan de Tests - Pastore Services

Ce document détaille la stratégie de validation pour le module "Comptes Clients + Demandes".

## 🛠 1. Tests Automatisés (API)
Lancez le script de test automatisé pour valider la logique backend de base.
Assurez-vous que le serveur tourne (`npm run dev` ou `npm run server`).

```bash
npm test
```

**Couverture du script :**
- [x] Inscription réussie
- [x] Inscription doublon (Email unique)
- [x] Login succès (Token JWT reçu)
- [x] Login échec (Mots de passe incorrects)
- [x] Création de demande (Données)
- [x] Protection des routes (401 Unauthorized)
- [x] Suppression de demande (Propriétaire uniquement)

---

## 🖐 2. Checklist de Tests Manuels & UX
À effectuer sur Smartphone (ou vue mobile Chrome DevTools) et Desktop.

### A. Comptes Clients
| Test | Action | Résultat Attendu |
|------|--------|------------------|
| **Validation Email** | Saisir `toto` dans le champ email | Le navigateur ou l'UI affiche une erreur de format. |
| **Validation MDP** | Saisir un mot de passe vide | Bouton "S'inscrire" désactivé ou erreur. |
| **Persistance** | Se connecter, rafraîchir la page (F5) | L'utilisateur reste connecté (Session localStorage). |
| **Déconnexion** | Cliquer sur "Déconnexion" | Redirection Accueil, Token supprimé du Storage. |
| **Mot de passe oublié** | Demander un reset pour un email valide | Un email avec le MDP temporaire arrive. Le MDP fonctionne. |
| **Mot de passe oublié** | Demander un reset pour un email *inconnu* | Message générique de succès (Sécurité: ne pas dire que l'email n'existe pas). |

### B. Création de Demande & Upload
| Test | Action | Résultat Attendu |
|------|--------|------------------|
| **Photos Multiples** | Sélectionner 3 photos | Les 3 aperçus s'affichent avec bouton "X". |
| **Suppression Photo** | Cliquer sur "X" d'une photo | La photo disparaît de l'aperçu et ne sera pas envoyée. |
| **Fichier Invalide** | Tenter d'uploader un `.pdf` ou `.docx` | Le backend rejette (400) ou le sélecteur de fichier grise l'option. |
| **Fichier Lourd** | Uploader une image > 5Mo | Erreur explicite "Fichier trop volumineux". |
| **Feedback Visuel** | Cliquer sur "Envoyer" | Spinner de chargement visible. Bouton désactivé (anti-double-clic). |
| **Succès** | Après envoi | Redirection vers le Dashboard avec la nouvelle demande en haut de liste. |
| **Mode Invité** | Créer une demande sans être connecté | La demande est créée, mais n'apparaît pas dans l'historique (sauf si on implémente le linkage post-auth). |

### C. Emails (Nécessite configuration SMTP valide)
*Note: Si SMTP échoue, le serveur doit logger l'erreur mais NE PAS faire échouer la création de la demande.*
1.  **Notification Admin** : Vérifier la réception du mail sur `ADMIN_EMAIL` avec les pièces jointes.
2.  **Confirmation Client** : Vérifier la réception sur l'email client.

---

## 🛡 3. Tests de Sécurité & Cas Limites

### A. Uploads Malveillants
* **Test** : Renommer un fichier `virus.exe` en `image.png` et l'uploader.
* **Résultat attendu** :
    *   Le backend utilise `multer` qui vérifie le `mimetype`.
    *   Idéalement, le serveur ne doit pas exécuter le fichier s'il est appelé via URL.
    *   *Vérification* : Essayez d'accéder à `/uploads/nom_du_fichier`. Le navigateur doit l'afficher comme image ou le télécharger, pas l'exécuter. Le middleware `helmet` aide ici.

### B. Injection & XSS
* **Test** : Dans la description de la demande, saisir : `<script>alert('Hacked')</script>`.
* **Résultat attendu** :
    *   Sur le Dashboard, le texte doit s'afficher tel quel (échappé par React par défaut).
    *   La pop-up ne doit PAS s'ouvrir.

### C. Accès Non Autorisé aux Fichiers
* **Test** : Essayer d'accéder à `http://localhost:3000/uploads/../.env`.
* **Résultat attendu** : Express bloque par défaut la traversée de dossiers (`..`), erreur 404 ou 403.

### D. Panne SMTP
* **Test** : Mettre un mot de passe SMTP incorrect dans `.env`. Tenter une demande.
* **Résultat attendu** : La demande est créée en base (Succès pour l'utilisateur), l'erreur email est logguée côté serveur (`console.error`), le serveur ne crashe pas.

---

## 🚨 En cas d'erreur
Si un test échoue :
1. Vérifier les logs du serveur (Terminal bleu).
2. Vérifier l'onglet "Réseau" (Network) de la console développeur du navigateur (F12).
3. Vérifier que le fichier `.env` est correctement chargé.
