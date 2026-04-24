/**
 * main.js — Processus principal Electron
 *
 * Responsabilités :
 *  1. Démarre le serveur backend Node.js (child process)
 *  2. Crée la fenêtre principale
 *  3. Gère la détection online/offline
 *  4. Orchestre la synchronisation automatique
 *  5. Expose les handlers IPC pour le renderer
 */

const { app, BrowserWindow, ipcMain, net, shell } = require('electron');
const path = require('path');
const { spawn }  = require('child_process');
const Store      = require('electron-store');
const { createMainWindow } = require('./window');

// ── Instances globales ────────────────────────────────────────────────────────
let mainWindow   = null;
let backendProc  = null;
let syncManager  = null;
const store = new Store({ name: 'hestim-state' });

// ── Importer les services (CommonJS) ─────────────────────────────────────────
const { initSqlDB }   = require('../local-db/index');
const { initDB }      = require('../local-db/schema');
const SyncManager     = require('../sync-service/syncManager');
const SyncLogger      = require('../sync-service/logger');

// ── 1. Démarrage du backend Node.js ──────────────────────────────────────────
function startBackend() {
    const isDev = process.env.NODE_ENV === 'development';
    const backendPath = isDev
        ? path.join(__dirname, '../backend/server.js')
        : path.join(process.resourcesPath, 'backend/server.js');

    backendProc = spawn('node', [backendPath], {
        env: { ...process.env, PORT: '5000' },
        cwd: isDev ? path.join(__dirname, '../backend') : path.join(process.resourcesPath, 'backend'),
    });

    backendProc.stdout.on('data', (d) => console.log('[BACKEND]', d.toString().trim()));
    backendProc.stderr.on('data', (d) => console.error('[BACKEND ERR]', d.toString().trim()));
    backendProc.on('close', (code) => console.log(`[BACKEND] Processus terminé (code ${code})`));

    console.log('[MAIN] Backend démarré (PID:', backendProc.pid, ')');
}

// Attendre que le backend soit prêt (polling)
function waitForBackend(url = 'http://localhost:5000/api/health', maxRetries = 20) {
    return new Promise((resolve, reject) => {
        let retries = 0;
        const check = () => {
            const req = net.request(url);
            req.on('response', () => resolve());
            req.on('error',    () => {
                if (++retries >= maxRetries) reject(new Error('Backend non disponible'));
                else setTimeout(check, 500);
            });
            req.end();
        };
        check();
    });
}

// ── 2. Détection online/offline ───────────────────────────────────────────────
let isOnline = net.isOnline();

function checkOnlineStatus() {
    const current = net.isOnline();
    if (current !== isOnline) {
        isOnline = current;
        console.log(`[MAIN] Réseau : ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
        mainWindow?.webContents.send('net:change', isOnline);

        // Déclencher une sync automatique au retour en ligne
        if (isOnline && syncManager) {
            setTimeout(() => syncManager.sync(), 2000); // délai de stabilisation
        }
    }
}

// ── 3. Handlers IPC ───────────────────────────────────────────────────────────
function registerIpcHandlers() {
    const { getAffectations, saveAffectation, deleteAffectation } = require('../local-db/queries/affectations');

    // Réseau
    ipcMain.handle('net:status', () => isOnline);

    // Sync
    ipcMain.handle('sync:trigger', async () => {
        if (!syncManager) return { error: 'SyncManager non initialisé' };
        return syncManager.sync();
    });

    ipcMain.handle('sync:status', () => ({
        lastSync:    store.get('lastSyncAt'),
        pending:     store.get('pendingCount', 0),
        isOnline,
    }));

    // DB locale
    ipcMain.handle('db:affectations:get',    (_, filters) => getAffectations(filters));
    ipcMain.handle('db:affectations:save',   (_, data)    => saveAffectation(data));
    ipcMain.handle('db:affectations:delete', (_, id)      => deleteAffectation(id));

    // Token sync
    ipcMain.handle('sync:setToken',   (_, token) => syncManager?.setAuthToken(token));
    ipcMain.handle('sync:clearToken', ()          => syncManager?.clearAuthToken());

    // App
    ipcMain.handle('app:version', () => app.getVersion());
    ipcMain.handle('app:openLogs', () => {
        shell.openPath(SyncLogger.getLogPath());
    });
}

// ── 4. Cycle de vie Electron ──────────────────────────────────────────────────
app.whenReady().then(async () => {
    try {
        // Initialiser sql.js (WASM) puis le schéma
        await initSqlDB();
        initDB();
        console.log('[MAIN] SQLite initialisé');

        // Démarrer backend
        startBackend();

        // Attendre que le backend soit prêt (avec timeout)
        try {
            await waitForBackend();
            console.log('[MAIN] Backend prêt');
        } catch {
            console.warn('[MAIN] Backend non joignable — mode offline activé');
        }

        // Créer le SyncManager
        syncManager = new SyncManager({
            apiBase: 'http://localhost:5000/api',
            store,
            onEvent: (event) => mainWindow?.webContents.send('sync:event', event),
        });

        // Créer la fenêtre
        mainWindow = createMainWindow();
        registerIpcHandlers();

        // Vérifier le réseau toutes les 5 secondes
        setInterval(checkOnlineStatus, 5000);

        // Sync initiale si online
        if (isOnline) {
            setTimeout(() => syncManager.sync(), 3000);
        }
    } catch (err) {
        console.error('[MAIN] Erreur démarrage:', err);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        backendProc?.kill();
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
    }
});

app.on('before-quit', () => {
    backendProc?.kill();
});
