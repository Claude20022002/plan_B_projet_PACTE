/**
 * logger.js — Journal de synchronisation
 * Écrit dans un fichier log rotatif dans userData/logs/sync.log
 */

const fs   = require('fs');
const path = require('path');
const { app } = require('electron');

let logPath = null;

function getLogPath() {
    if (!logPath) {
        const logsDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
        logPath = path.join(logsDir, 'sync.log');
    }
    return logPath;
}

function write(level, msg, data = null) {
    const ts   = new Date().toISOString();
    const line = `[${ts}] [${level.toUpperCase()}] ${msg}` +
                 (data ? ' | ' + JSON.stringify(data) : '') + '\n';
    console.log(line.trim());
    try {
        fs.appendFileSync(getLogPath(), line);
    } catch { /* silently ignore if can't write */ }
}

const log = {
    info:  (msg, data) => write('INFO',  msg, data),
    warn:  (msg, data) => write('WARN',  msg, data),
    error: (msg, data) => write('ERROR', msg, data),
    sync:  (msg, data) => write('SYNC',  msg, data),
    getLogPath,
};

module.exports = log;
