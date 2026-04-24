const { BrowserWindow } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

/**
 * Crée la fenêtre principale de l'application.
 * En développement : charge http://localhost:5173 (Vite dev server)
 * En production    : charge le bundle React compilé
 */
function createMainWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'HESTIM Planner',
        icon: path.join(__dirname, '../frontend/public/favicon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,   // sécurité : isoler le renderer
            nodeIntegration: false,   // sécurité : pas de Node dans le renderer
            sandbox: false,           // nécessaire pour preload contextBridge
        },
        show: false, // afficher après prêt (évite le flash blanc)
        backgroundColor: '#f4f6fb',
    });

    // Affiche la fenêtre une fois le DOM chargé
    win.once('ready-to-show', () => {
        win.show();
        if (isDev) win.webContents.openDevTools({ mode: 'detach' });
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');
    } else {
        win.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
    }

    // Empêche la navigation vers des URLs extérieures
    win.webContents.on('will-navigate', (event, url) => {
        const allowedOrigins = ['http://localhost:5173', 'file://'];
        if (!allowedOrigins.some(o => url.startsWith(o))) {
            event.preventDefault();
        }
    });

    return win;
}

module.exports = { createMainWindow };
