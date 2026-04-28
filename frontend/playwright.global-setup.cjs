/**
 * Playwright Global Setup — exécuté UNE FOIS avant tous les tests.
 * 1. Attend que le backend soit prêt
 * 2. Lance le seed (idempotent)
 * 3. Récupère des credentials valides via l'API et les sauvegarde dans auth/credentials.json
 */

const { exec } = require('child_process');
const path     = require('path');
const http     = require('http');
const https    = require('https');
const fs       = require('fs');

const BACKEND_URL = 'http://127.0.0.1:5000/health';
const API_BASE    = 'http://127.0.0.1:5000/api';
const AUTH_DIR    = path.join(__dirname, 'auth');
const CREDS_FILE  = path.join(AUTH_DIR, 'credentials.json');

// ── Helpers ───────────────────────────────────────────────────────────────────

function waitForBackend(retries = 0, max = 30) {
    return new Promise((resolve, reject) => {
        http.get(BACKEND_URL, (res) => {
            if (res.statusCode === 200) { console.log('✓ Backend prêt'); resolve(); }
            else retry();
        }).on('error', retry);

        function retry() {
            if (retries < max) setTimeout(() => waitForBackend(retries + 1, max).then(resolve).catch(reject), 2000);
            else reject(new Error('Backend non disponible après ' + max + ' tentatives'));
        }
    });
}

function runSeed() {
    return new Promise((resolve, reject) => {
        const proc = exec('npm run seed', { cwd: path.join(__dirname, '../backend') });
        proc.stdout.on('data', d => process.stdout.write(`[Seed] ${d}`));
        proc.stderr.on('data', d => process.stderr.write(`[Seed ERR] ${d}`));
        proc.on('close', code => {
            if (code === 0) { console.log('✓ Seed terminé'); resolve(); }
            else reject(new Error(`Seed exit code ${code}`));
        });
        proc.on('error', reject);
    });
}

/** Appel HTTP simple (node natif, pas de fetch) */
function httpPost(urlStr, body) {
    return new Promise((resolve, reject) => {
        const url  = new URL(urlStr);
        const data = JSON.stringify(body);
        const opts = {
            hostname: url.hostname, port: url.port || 80, path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        };
        const req = http.request(opts, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch { reject(new Error('JSON parse error: ' + raw)); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function httpGet(urlStr, token) {
    return new Promise((resolve, reject) => {
        const url  = new URL(urlStr);
        const opts = {
            hostname: url.hostname, port: url.port || 80,
            path: url.pathname + url.search,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        };
        const req = http.request(opts, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch { reject(new Error('JSON parse error')); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// ── Fetch credentials depuis l'API ────────────────────────────────────────────

async function fetchCredentials() {
    // Login admin
    const adminLogin = await httpPost(`${API_BASE}/auth/login`, {
        email: 'admin@hestim.ma', password: 'password123',
    });
    if (adminLogin.status !== 200) throw new Error('Login admin échoué: ' + adminLogin.status);
    const adminToken = adminLogin.body.token;

    // Trouver un enseignant valide
    const ensRes = await httpGet(`${API_BASE}/enseignants?limit=1`, adminToken);
    const firstEns = ensRes.body?.data?.[0];
    const ensEmail = firstEns?.user?.email;

    // Trouver un étudiant valide
    const etuRes = await httpGet(`${API_BASE}/etudiants?limit=1`, adminToken);
    const firstEtu = etuRes.body?.data?.[0];
    const etuEmail = firstEtu?.user?.email;

    const creds = {
        admin:      { email: 'admin@hestim.ma',    password: 'password123' },
        enseignant: { email: ensEmail || '',         password: 'password123' },
        etudiant:   { email: etuEmail || '',         password: 'password123' },
        generatedAt: new Date().toISOString(),
    };

    if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
    fs.writeFileSync(CREDS_FILE, JSON.stringify(creds, null, 2));

    console.log(`✓ Credentials sauvegardés :`);
    console.log(`   admin      : ${creds.admin.email}`);
    console.log(`   enseignant : ${creds.enseignant.email}`);
    console.log(`   etudiant   : ${creds.etudiant.email}`);

    return creds;
}

// ── Entry point ───────────────────────────────────────────────────────────────

module.exports = async function globalSetup() {
    console.log('\n=== Playwright Global Setup ===\n');

    try {
        console.log('⏳ Attente du backend...');
        await waitForBackend();

        console.log('⏳ Exécution du seed (idempotent)...');
        try {
            await runSeed();
        } catch (seedErr) {
            console.warn('⚠️  Seed échoué (données existantes ?) :', seedErr.message);
            // Pas bloquant si les données existent déjà
        }

        console.log('⏳ Récupération des credentials...');
        await fetchCredentials();

        console.log('\n✅ Global Setup terminé\n');
    } catch (err) {
        console.error('❌ Global Setup échoué :', err.message);
        // Créer un fichier creds minimal pour ne pas bloquer les tests
        if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
        if (!fs.existsSync(CREDS_FILE)) {
            fs.writeFileSync(CREDS_FILE, JSON.stringify({
                admin:      { email: 'admin@hestim.ma',           password: 'password123' },
                enseignant: { email: 'alain.bennis0@hestim.ma',   password: 'password123' },
                etudiant:   { email: 'hamza.benali0@hestim.ma',   password: 'password123' },
            }));
        }
    }
};
