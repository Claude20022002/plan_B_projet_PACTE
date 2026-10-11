// @ts-check
/**
 * Parcours de démonstration (lot B-8) : `npm run test:parcours`. Chaque passage repart d'une base
 * de test jetable, préparée par tests/parcours/serveur.mjs avant le démarrage du serveur ; les
 * comptes sont créés à ce moment, aucun identifiant n'est écrit dans les tests.
 *
 * Ports du groupe B par défaut (serveur 5001, site 5174), modifiables par PARCOURS_PORT_API et
 * PARCOURS_PORT_SITE. Il faut le conteneur MySQL des tests (hestim_mysql_test, port 3307) ou les
 * variables DB_HOST, DB_PORT, DB_USER et DB_PASSWORD.
 */
const { defineConfig, devices } = require("@playwright/test");

const portApi = process.env.PARCOURS_PORT_API || "5001";
const portSite = process.env.PARCOURS_PORT_SITE || "5174";

module.exports = defineConfig({
  testDir: "./tests/parcours",
  testMatch: ["**/*.spec.cjs"],
  // Une seule base pour tous les parcours : ils passent l'un après l'autre
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-parcours", open: "never" }]],
  use: {
    baseURL: `http://localhost:${portSite}`,
    locale: "fr-FR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node tests/parcours/serveur.mjs",
      url: `http://127.0.0.1:${portApi}/health`,
      // Jamais un serveur déjà lancé : chaque passage doit repartir de la base préparée
      reuseExistingServer: false,
      timeout: 90_000,
      env: { PARCOURS_PORT_API: portApi, PARCOURS_PORT_SITE: portSite },
    },
    {
      command: `npx vite --port ${portSite} --strictPort`,
      url: `http://localhost:${portSite}`,
      reuseExistingServer: false,
      timeout: 90_000,
      env: { VITE_PROXY_TARGET: `http://localhost:${portApi}`, VITE_API_URL: "/api" },
    },
  ],
});
