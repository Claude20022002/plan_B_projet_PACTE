// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: false,   // séquentiel pour éviter les conflits de session
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 1,
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
    ],

    use: {
        baseURL:           'http://localhost:5173',
        trace:             'on-first-retry',
        screenshot:        'only-on-failure',
        video:             'retain-on-failure',
        actionTimeout:     10_000,
        navigationTimeout: 15_000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Démarrer le serveur Vite avant les tests
    webServer: {
        command:   'npm run dev',
        url:       'http://localhost:5173',
        reuseExistingServer: true,
        timeout:   60_000,
    },
});
