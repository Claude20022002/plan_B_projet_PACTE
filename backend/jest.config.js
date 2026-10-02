/**
 * Configuration Jest pour projet ESM (type: "module")
 * Nécessite: node --experimental-vm-modules node_modules/.bin/jest
 */
export default {
    testEnvironment: 'node',
    // Pas de transform : Jest utilise le loader ESM natif de Node
    transform: {},
    testMatch: ['**/tests/**/*.test.js'],
    // Les tests d'intégration (base MySQL requise) ont leur propre config : jest.integration.config.js
    testPathIgnorePatterns: ['/node_modules/', '/tests/integration/'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'utils/passwordHelper.js',
        'utils/paginationHelper.js',
        'utils/dateHelper.js',
        'utils/validationHelper.js',
        'middleware/roleMiddleware.js',
    ],
    // Variables d'environnement pour les tests (sans vraie DB)
    testEnvironmentOptions: {
        env: {
            NODE_ENV: 'test',
            JWT_SECRET: 'test_secret_jest',
        },
    },
};
