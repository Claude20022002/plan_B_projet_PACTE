/**
 * Configuration Jest des tests d'intégration (API + base MySQL de test).
 * Lancement : npm run test:integration (base décrite dans tests/integration/setupEnv.js)
 */
export default {
    testEnvironment: "node",
    transform: {},
    testMatch: ["**/tests/integration/**/*.test.js"],
    setupFiles: ["<rootDir>/tests/integration/setupEnv.js"],
    // Une seule base partagée : les fichiers s'exécutent l'un après l'autre
    maxWorkers: 1,
    testTimeout: 30000,
};
