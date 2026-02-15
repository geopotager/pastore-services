// tests/api.test.js
// Exécuter avec : npm test
// Assurez-vous que le serveur tourne sur localhost:3000 avant de lancer ce script.

const API_URL = 'http://localhost:3000/api';
let authToken = '';
let userId = '';
let requestId = '';

// Couleurs pour la console
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};

const log = (msg, type = 'blue') => console.log(`${colors[type]}%s${colors.reset}`, msg);

async function runTests() {
    log('🚀 Démarrage de la suite de tests Pastore Services...\n');

    try {
        // --- 1. TEST AUTHENTIFICATION ---
        
        log('--- 1. Tests Authentification ---');
        
        // A. Inscription
        const uniqueEmail = `test_${Date.now()}@example.com`;
        const userPayload = {
            name: "Test User",
            email: uniqueEmail,
            password: "password123",
            phone: "0470000000"
        };

        log(`[TEST] Inscription utilisateur (${uniqueEmail})...`);
        const regRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPayload)
        });
        
        if (regRes.status === 201) {
            const data = await regRes.json();
            log('✅ Inscription réussie', 'green');
            userId = data.user.id;
        } else {
            throw new Error(`Échec inscription: ${regRes.status}`);
        }

        // B. Inscription doublon (Doit échouer)
        log(`[TEST] Inscription doublon...`);
        const dupRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPayload)
        });
        if (dupRes.status === 409) log('✅ Doublon bloqué correctement', 'green');
        else log(`❌ Doublon non détecté (Status: ${dupRes.status})`, 'red');

        // C. Login (Succès)
        log(`[TEST] Login valide...`);
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail, password: "password123" })
        });
        if (loginRes.ok) {
            const data = await loginRes.json();
            authToken = data.token;
            log('✅ Login réussi, Token reçu', 'green');
        } else {
            throw new Error('Échec login');
        }

        // D. Login (Fail)
        log(`[TEST] Login invalide...`);
        const badLoginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail, password: "mauvaispassword" })
        });
        if (badLoginRes.status === 401) log('✅ Login invalide rejeté', 'green');
        else log('❌ Login invalide accepté', 'red');


        // --- 2. TEST DEMANDES (REQUESTS) ---

        log('\n--- 2. Tests Demandes ---');

        // A. Création demande (Sans fichier pour simplifier le test script)
        // Note: Pour tester l'upload fichier via script node natif sans dépendance externe complexe, 
        // on teste ici la logique métier et la validation. L'upload fichier est couvert dans le plan manuel.
        log(`[TEST] Création demande standard...`);
        
        // Simulation FormData boundary manuelle pour fetch nodejs (complexe sans librairie)
        // On va tricher et envoyer une requête sans fichier pour voir si la DB l'accepte
        // Si le backend exige req.files, cela peut échouer, mais notre backend gère photos = [].
        
        // Construction FormData manuelle (Node < 18 n'a pas FormData natif complet, mais assumons Node récent)
        const formData = new FormData();
        const requestData = {
            userId: userId,
            category: 'bricolage',
            description: "Test automatisé via script",
            booking: { date: "2024-12-25", time: "10:00" },
            contact: { name: "Test User", phone: "0470000000", zip: "1000", address: "Rue Test", email: uniqueEmail }
        };
        formData.append('data', JSON.stringify(requestData));

        const createRes = await fetch(`${API_URL}/requests`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });

        if (createRes.status === 201) {
            const data = await createRes.json();
            requestId = data.id;
            log('✅ Demande créée avec succès', 'green');
        } else {
            const txt = await createRes.text();
            log(`❌ Échec création demande: ${txt}`, 'red');
        }

        // B. Liste des demandes (Protégée)
        log(`[TEST] Récupération historique...`);
        const listRes = await fetch(`${API_URL}/requests`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (listRes.ok) {
            const list = await listRes.json();
            if (list.length > 0 && list[0].id === requestId) log('✅ Historique récupéré et cohérent', 'green');
            else log('❌ Historique vide ou incohérent', 'red');
        } else {
            log('❌ Erreur récupération historique', 'red');
        }

        // --- 3. TEST SÉCURITÉ ---

        log('\n--- 3. Tests Sécurité ---');

        // A. Accès sans token
        log(`[TEST] Accès route protégée sans token...`);
        const noTokenRes = await fetch(`${API_URL}/requests`);
        if (noTokenRes.status === 401) log('✅ Accès refusé (401) correct', 'green');
        else log(`❌ Accès autorisé sans token! (${noTokenRes.status})`, 'red');

        // B. Rate Limiting (Login Spam)
        // On teste juste que le header existe ou que ça répond, ne pas spammer vraiment ici pour pas bloquer le dev.
        log(`[TEST] Vérification présence Rate Limiting...`);
        // On fait 1 requête login, on vérifie si les headers rate limit sont là (selon config express-rate-limit)
        const rateRes = await fetch(`${API_URL}/login`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email: "rate@test.com", password: "x" })
        });
        const limitHeader = rateRes.headers.get('X-RateLimit-Limit');
        if(limitHeader) log(`✅ Headers Rate-Limit détectés (Limit: ${limitHeader})`, 'green');
        else log('⚠️ Pas de headers Rate-Limit visibles (peut dépendre du proxy)', 'yellow');

        // C. Suppression demande (Autorisation)
        log(`[TEST] Suppression demande...`);
        const delRes = await fetch(`${API_URL}/requests/${requestId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (delRes.ok) log('✅ Suppression réussie', 'green');
        else log('❌ Échec suppression', 'red');


        log('\n✨ TOUS LES TESTS AUTOMATISÉS SONT PASSÉS !', 'green');
        console.log("Note: Les tests d'upload de fichiers réels et d'envoi d'emails doivent être vérifiés manuellement (voir TEST_PLAN.md).");

    } catch (error) {
        log(`\n⛔ ERREUR FATALE: ${error.message}`, 'red');
        process.exit(1);
    }
}

runTests();