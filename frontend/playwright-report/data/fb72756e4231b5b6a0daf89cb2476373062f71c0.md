# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.cjs >> 🔐 Authentification >> redirige vers /connexion si non authentifié
- Location: tests\app.spec.cjs:27:5

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:5173/dashboard/admin", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * app.spec.js — Suite de tests Playwright complète pour HESTIM Planner
  3   |  *
  4   |  * Couverture :
  5   |  *  ✅ Authentification (login valide/invalide, logout, redirection)
  6   |  *  ✅ Navigation admin (toutes les routes protégées)
  7   |  *  ✅ Navigation enseignant / étudiant
  8   |  *  ✅ Formulaires (validation, soumission, messages d'erreur)
  9   |  *  ✅ CRUD (Utilisateurs, Affectations, Salles)
  10  |  *  ✅ Comportement offline indicator
  11  |  *  ✅ Export Excel
  12  |  *  ✅ Notifications
  13  |  *  ✅ Thème et persistance
  14  |  *
  15  |  * Pour lancer : npx playwright test
  16  |  * Pour un seul describe : npx playwright test --grep "Auth"
  17  |  */
  18  | 
  19  | const { test, expect } = require('@playwright/test');
  20  | const { loginViaToken, login, logout, USERS } = require('./helpers/auth.helper.cjs');
  21  | 
  22  | // ══════════════════════════════════════════════════════════════════════════════
  23  | // 1. AUTHENTIFICATION
  24  | // ══════════════════════════════════════════════════════════════════════════════
  25  | test.describe('🔐 Authentification', () => {
  26  | 
  27  |     test('redirige vers /connexion si non authentifié', async ({ page }) => {
> 28  |         await page.goto('/dashboard/admin');
      |                    ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
  29  |         await expect(page).toHaveURL(/connexion/);
  30  |     });
  31  | 
  32  |     test('redirige vers /connexion depuis toute route protégée', async ({ page }) => {
  33  |         const routes = ['/dashboard/enseignant', '/gestion/utilisateurs', '/statistiques', '/mes-affectations'];
  34  |         for (const route of routes) {
  35  |             await page.goto(route);
  36  |             await expect(page).toHaveURL(/connexion/, { timeout: 5000 });
  37  |         }
  38  |     });
  39  | 
  40  |     test('login valide admin → dashboard/admin', async ({ page }) => {
  41  |         await login(page, 'admin');
  42  |         await expect(page).toHaveURL(/dashboard\/admin/);
  43  |         await expect(page.getByText(/tableau de bord administrateur/i)).toBeVisible();
  44  |     });
  45  | 
  46  |     test('login invalide affiche une alerte d\'erreur', async ({ page }) => {
  47  |         await page.goto('/connexion');
  48  |         await page.getByLabel(/email/i).fill(USERS.invalid.email);
  49  |         await page.getByLabel(/mot de passe/i).fill(USERS.invalid.password);
  50  |         await page.getByRole('button', { name: /connexion/i }).click();
  51  | 
  52  |         // Attendre l'alerte d'erreur
  53  |         const alert = page.locator('[role="alert"], .MuiAlert-root');
  54  |         await expect(alert).toBeVisible({ timeout: 5000 });
  55  |         await expect(alert).not.toBeEmpty();
  56  |     });
  57  | 
  58  |     test('champs email et mot de passe vides → bouton désactivé ou erreur visible', async ({ page }) => {
  59  |         await page.goto('/connexion');
  60  |         const btn = page.getByRole('button', { name: /connexion/i });
  61  | 
  62  |         // Soit le bouton est désactivé, soit cliquer affiche une erreur
  63  |         const isDisabled = await btn.isDisabled().catch(() => false);
  64  |         if (!isDisabled) {
  65  |             await btn.click();
  66  |             // Un message d'erreur doit apparaître
  67  |             await expect(page.locator('[role="alert"], .MuiAlert-root, .MuiFormHelperText-root')).toBeVisible({ timeout: 3000 });
  68  |         } else {
  69  |             expect(isDisabled).toBe(true);
  70  |         }
  71  |     });
  72  | 
  73  |     test('logout redirige vers /connexion et vide le token', async ({ page }) => {
  74  |         await loginViaToken(page, 'admin');
  75  |         await logout(page);
  76  |         await expect(page).toHaveURL(/connexion/);
  77  | 
  78  |         // Vérifier que le token est supprimé
  79  |         const token = await page.evaluate(() => localStorage.getItem('token'));
  80  |         expect(token).toBeNull();
  81  |     });
  82  | 
  83  |     test('le thème est réinitialisé après déconnexion', async ({ page }) => {
  84  |         await loginViaToken(page, 'admin');
  85  |         // Forcer un thème dark
  86  |         await page.evaluate(() => localStorage.setItem('themeMode', 'dark'));
  87  |         await logout(page);
  88  | 
  89  |         const themeMode = await page.evaluate(() => localStorage.getItem('themeMode'));
  90  |         expect(themeMode).toBeNull();
  91  |     });
  92  | 
  93  |     test('token invalide → redirection vers login', async ({ page }) => {
  94  |         await page.goto('/');
  95  |         await page.evaluate(() => localStorage.setItem('token', 'invalid.jwt.token'));
  96  |         await page.goto('/dashboard/admin');
  97  |         await expect(page).toHaveURL(/connexion/, { timeout: 8000 });
  98  |     });
  99  | });
  100 | 
  101 | // ══════════════════════════════════════════════════════════════════════════════
  102 | // 2. NAVIGATION ADMIN
  103 | // ══════════════════════════════════════════════════════════════════════════════
  104 | test.describe('🧭 Navigation Admin', () => {
  105 | 
  106 |     test.beforeEach(async ({ page }) => {
  107 |         await loginViaToken(page, 'admin');
  108 |     });
  109 | 
  110 |     test('dashboard admin se charge avec KPIs', async ({ page }) => {
  111 |         await page.goto('/dashboard/admin');
  112 |         await page.waitForLoadState('networkidle');
  113 |         await expect(page.getByText(/tableau de bord administrateur/i)).toBeVisible();
  114 |         // Au moins une carte KPI visible
  115 |         await expect(page.locator('.MuiCard-root')).toHaveCount({ min: 1 });
  116 |     });
  117 | 
  118 |     const adminRoutes = [
  119 |         { path: '/gestion/utilisateurs',          title: /utilisateurs/i },
  120 |         { path: '/gestion/enseignants',            title: /enseignants/i },
  121 |         { path: '/gestion/etudiants',              title: /étudiants/i },
  122 |         { path: '/gestion/filieres',               title: /filières/i },
  123 |         { path: '/gestion/groupes',                title: /groupes/i },
  124 |         { path: '/gestion/salles',                 title: /salles/i },
  125 |         { path: '/gestion/cours',                  title: /cours/i },
  126 |         { path: '/gestion/creneaux',               title: /créneaux/i },
  127 |         { path: '/gestion/affectations',           title: /affectations/i },
  128 |         { path: '/gestion/conflits',               title: /conflits/i },
```