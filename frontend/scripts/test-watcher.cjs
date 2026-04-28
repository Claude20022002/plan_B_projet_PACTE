#!/usr/bin/env node
/**
 * test-watcher.js — Générateur automatique de tests Playwright
 *
 * Surveille les fichiers .jsx dans src/pages/ et génère automatiquement
 * un fichier de test skeleton dans tests/generated/ à chaque modification.
 *
 * Usage : node scripts/test-watcher.js
 *       : npm run test:watch
 */

const chokidar = require('chokidar');
const fs       = require('fs');
const path     = require('path');

const PAGES_DIR   = path.join(__dirname, '../src/pages');
const TESTS_DIR   = path.join(__dirname, '../tests/generated');
const HELPERS_DIR = path.join(__dirname, '../tests/helpers');

// Créer le dossier generated s'il n'existe pas
if (!fs.existsSync(TESTS_DIR)) fs.mkdirSync(TESTS_DIR, { recursive: true });

// ── Analyse d'un fichier JSX ─────────────────────────────────────────────────

/**
 * Extrait les infos utiles d'un fichier JSX pour générer les tests.
 */
function analyzeJSX(filePath) {
    const content   = fs.readFileSync(filePath, 'utf8');
    const fileName  = path.basename(filePath, '.jsx');
    const relPath   = path.relative(PAGES_DIR, filePath).replace(/\\/g, '/');

    // Détecter les patterns
    const hasForm      = /useFormik|<form|onSubmit/i.test(content);
    const hasTable     = /TableBody|MuiTable|<Table/i.test(content);
    const hasSnackbar  = /Snackbar|setError|setSuccess/i.test(content);
    const hasDialog    = /Dialog|setOpen/i.test(content);
    const hasExport    = /exportToExcel|handleExport/i.test(content);
    const hasSearch    = /search|setSearch|Rechercher/i.test(content);
    const hasDelete    = /handleDelete|window\.confirm/i.test(content);
    const hasPagination = /TablePagination|setPage/i.test(content);

    // Extraire les labels de boutons (approximation)
    const buttonLabels = [...content.matchAll(/name[=:]\s*['"]([\w\séàèêùîôçæœ]+)['"]/gi)]
        .map(m => m[1])
        .filter(l => l.length > 2 && l.length < 40)
        .slice(0, 5);

    // Extraire les messages d'erreur Yup
    const yupErrors = [...content.matchAll(/\.required\(['"]([^'"]+)['"]\)/g)]
        .map(m => m[1])
        .slice(0, 5);

    return {
        fileName, relPath, hasForm, hasTable, hasSnackbar,
        hasDialog, hasExport, hasSearch, hasDelete, hasPagination,
        buttonLabels, yupErrors,
    };
}

// ── Générateur de template test ───────────────────────────────────────────────

/**
 * Génère le contenu d'un fichier de test .spec.js.
 */
function generateTestFile(info, route) {
    const { fileName, hasForm, hasTable, hasSnackbar, hasDialog, hasExport, hasSearch, hasDelete } = info;
    const testName = fileName.replace(/([A-Z])/g, ' $1').trim();
    const timestamp = new Date().toISOString();

    return `// AUTO-GENERATED par test-watcher.js — ${timestamp}
// Source: src/pages/${info.relPath}
// ⚠️  Ce fichier est regénéré automatiquement. Personnalisez tests/app.spec.js

const { test, expect } = require('@playwright/test');
const { loginViaToken } = require('../helpers/auth.helper.cjs');

test.describe('🤖 [AUTO] ${testName}', () => {

    test.beforeEach(async ({ page }) => {
        // Adapter le rôle selon la page
        await loginViaToken(page, 'admin');
        await page.goto('${route}');
        await page.waitForLoadState('networkidle');
    });

    test('la page se charge sans erreur', async ({ page }) => {
        await expect(page).not.toHaveURL(/connexion/);
        await expect(page.locator('body')).not.toBeEmpty();
        // Aucune erreur critique visible
        await expect(page.locator('.MuiAlert-root[severity="error"]')).not.toBeVisible();
    });

    test('le titre principal est visible', async ({ page }) => {
        await expect(page.locator('h4, h5, h6').first()).toBeVisible({ timeout: 5000 });
    });
${hasTable ? `
    test('le tableau de données se charge', async ({ page }) => {
        await expect(page.locator('table, .MuiTable-root')).toBeVisible({ timeout: 8000 });
    });
` : ''}${hasSearch ? `
    test('la recherche filtre les résultats', async ({ page }) => {
        const search = page.getByPlaceholder(/rechercher/i).first();
        if (await search.isVisible().catch(() => false)) {
            await search.fill('test_inexistant_xyz');
            await page.waitForTimeout(500);
            // Résultat filtré ou "aucun résultat"
        }
    });
` : ''}${hasDialog ? `
    test('le bouton "Ajouter" ouvre un dialog', async ({ page }) => {
        const btn = page.getByRole('button', { name: /ajouter|nouveau|créer/i }).first();
        if (await btn.isVisible().catch(() => false)) {
            await btn.click();
            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
            // Fermer
            await page.keyboard.press('Escape');
        }
    });

    test('le dialog se ferme avec Annuler', async ({ page }) => {
        const btn = page.getByRole('button', { name: /ajouter|nouveau|créer/i }).first();
        if (await btn.isVisible().catch(() => false)) {
            await btn.click();
            const dialog = page.locator('[role="dialog"]');
            const cancelBtn = dialog.getByRole('button', { name: /annuler/i });
            if (await cancelBtn.isVisible().catch(() => false)) {
                await cancelBtn.click();
                await expect(dialog).not.toBeVisible();
            }
        }
    });
` : ''}${hasForm ? `
    test('soumettre le formulaire vide affiche des erreurs de validation', async ({ page }) => {
        const addBtn = page.getByRole('button', { name: /ajouter|nouveau|créer/i }).first();
        if (await addBtn.isVisible().catch(() => false)) {
            await addBtn.click();
            const dialog = page.locator('[role="dialog"]');
            const submitBtn = dialog.getByRole('button', { name: /créer|ajouter|enregistrer|soumettre/i });
            if (await submitBtn.isVisible().catch(() => false)) {
                await submitBtn.click();
                await expect(
                    dialog.locator('.MuiFormHelperText-root, [role="alert"]').first()
                ).toBeVisible({ timeout: 5000 });
            }
        }
    });
` : ''}${hasExport ? `
    test('le bouton "Exporter Excel" est visible', async ({ page }) => {
        await expect(page.getByRole('button', { name: /exporter excel/i })).toBeVisible();
    });
` : ''}${hasSnackbar ? `
    test('les notifications de succès/erreur s\'affichent et disparaissent', async ({ page }) => {
        // Ce test vérifie que les Snackbars ne causent pas de crash DOM
        // (bug corrigé : pattern {error && <Snackbar>})
        await page.waitForTimeout(500);
        await expect(page.locator('body')).not.toBeEmpty();
    });
` : ''}${hasDelete ? `
    test('le bouton de suppression est présent', async ({ page }) => {
        const deleteBtn = page.locator('[aria-label*="supprim"], button:has([data-testid="DeleteIcon"])').first();
        // Test conditionnel si des données existent
        const hasRows = await page.locator('tbody tr').count() > 0;
        if (hasRows) {
            await expect(deleteBtn).toBeVisible();
        }
    });
` : ''}${hasPagination ? `
    test('la pagination est visible si données > 10', async ({ page }) => {
        const rowCount = await page.locator('tbody tr').count();
        if (rowCount >= 10) {
            await expect(page.locator('.MuiTablePagination-root')).toBeVisible();
        }
    });
` : ''}});
`;
}

// ── Mapper les fichiers JSX vers les routes URL ────────────────────────────────

function inferRoute(filePath) {
    const rel = path.relative(PAGES_DIR, filePath)
        .replace(/\\/g, '/')
        .replace('.jsx', '');

    const routeMap = {
        'gestion/Affectations':       '/gestion/affectations',
        'gestion/Cours':              '/gestion/cours',
        'gestion/Creneaux':           '/gestion/creneaux',
        'gestion/Enseignants':        '/gestion/enseignants',
        'gestion/Etudiants':          '/gestion/etudiants',
        'gestion/Filieres':           '/gestion/filieres',
        'gestion/Groupes':            '/gestion/groupes',
        'gestion/Salles':             '/gestion/salles',
        'gestion/Utilisateurs':       '/gestion/utilisateurs',
        'gestion/Conflits':           '/gestion/conflits',
        'gestion/DemandesReportAdmin':'/gestion/demandes-report',
        'gestion/GenerationAutomatique': '/gestion/generation-automatique',
        'dashboard/AdminDashboard':   '/dashboard/admin',
        'dashboard/EnseignantDashboard': '/dashboard/enseignant',
        'dashboard/EtudiantDashboard': '/dashboard/etudiant',
        'MesAffectations':            '/mes-affectations',
        'Disponibilites':             '/disponibilites',
        'DemandesReport':             '/demandes-report',
        'Notifications':              '/notifications',
        'Statistiques':               '/statistiques',
        'Connexion':                  '/connexion',
    };

    return routeMap[rel] || `/${rel.toLowerCase().replace(/\//g, '/')}`;
}

// ── Gestionnaire de changement ────────────────────────────────────────────────

function handleFileChange(filePath, event) {
    try {
        const info     = analyzeJSX(filePath);
        const route    = inferRoute(filePath);
        const content  = generateTestFile(info, route);
        const testFile = path.join(TESTS_DIR, `${info.fileName}.spec.js`);

        fs.writeFileSync(testFile, content);

        const icon = event === 'change' ? '🔄' : '✨';
        console.log(`${icon}  [${event.toUpperCase()}] ${path.basename(filePath)} → tests/generated/${info.fileName}.spec.js`);
    } catch (err) {
        console.error(`❌ Erreur génération pour ${filePath}:`, err.message);
    }
}

// ── Démarrage du watcher ──────────────────────────────────────────────────────

console.log('👁️  Test Watcher — HESTIM Planner');
console.log(`   Surveillance de : ${PAGES_DIR}`);
console.log(`   Sortie dans     : ${TESTS_DIR}`);
console.log('   Ctrl+C pour arrêter\n');

// Générer les tests pour tous les fichiers existants au démarrage
const pagesPattern = path.join(PAGES_DIR, '**/*.jsx');
chokidar
    .watch(pagesPattern, { ignoreInitial: false, persistent: true })
    .on('add',    (fp) => handleFileChange(fp, 'add'))
    .on('change', (fp) => handleFileChange(fp, 'change'))
    .on('ready',  ()   => console.log('\n✅ Watcher prêt — en attente de modifications...\n'));
