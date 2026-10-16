/** Isolated UI contract tests: all API traffic is mocked; no database or external services. */
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
    testDir: './tests/simulations',
    testMatch: '**/*.spec.cjs',
    workers: 1,
    timeout: 45000,
    reporter: 'list',
    outputDir: 'test-results/simulations',
    use: { baseURL: 'http://localhost:5180', screenshot: 'only-on-failure', channel: process.env.SIMULATION_BROWSER_CHANNEL || undefined },
    projects: [
        { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1366, height: 900 } } },
        { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    ],
    webServer: { command: 'node node_modules/vite/bin/vite.js --host localhost --port 5180 --strictPort', url: 'http://localhost:5180', reuseExistingServer: false, timeout: 90000 },
});
