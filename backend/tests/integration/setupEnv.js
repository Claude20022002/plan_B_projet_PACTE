/**
 * Variables d'environnement des tests d'intégration.
 * Exécuté AVANT le chargement des modules : comme dotenv ne remplace jamais une variable
 * déjà définie, le fichier .env de développement ne peut pas rediriger les tests vers
 * la vraie base. La CI peut surcharger chaque valeur (ex: DB_PORT=3306).
 *
 * En local : docker run -d --name hestim_mysql_test -e MYSQL_ROOT_PASSWORD=test_root \
 *            -e MYSQL_DATABASE=hestim_test -p 3307:3306 mysql:8.0
 */
const defaults = {
    NODE_ENV: "test",
    DB_HOST: "127.0.0.1",
    DB_PORT: "3307",
    DB_NAME: "hestim_test",
    DB_USER: "root",
    DB_PASSWORD: "test_root",
    DB_DIALECT: "mysql",
    JWT_SECRET: "jwt_secret_tests_integration",
    JWT_ACCESS_SECRET: "jwt_secret_tests_integration",
    CSRF_SECRET: "csrf_secret_tests_integration",
    ALLOWED_ORIGINS: "http://localhost:5173",
    COOKIE_SAMESITE: "strict",
    SEED_ON_EMPTY: "false",
    // Vides : aucun email ne peut partir pendant les tests
    SMTP_USER: "",
    EMAIL_USER: "",
    // Vides : intégrations désactivées sauf dans les tests qui les configurent (pas celles du .env local)
    INTEGRATION_TOKEN: "",
    CLASSQUIZ_OIDC_CLIENT_SECRET: "",
    QUIZ_URL: "",
    OIDC_COOKIE_KEYS: "",
    QUIZ_WEBHOOK_SECRET: "",
    // Double authentification obligatoire pour l'administration : activée seulement dans mfa.test.js
    // (les autres fichiers connectent leurs administrateurs par mot de passe seul)
    MFA_ADMINS_OBLIGATOIRE: "false",
};

for (const [key, value] of Object.entries(defaults)) {
    if (process.env[key] === undefined) {
        process.env[key] = value;
    }
}
// Toujours forcer le mode test, même si le shell définit NODE_ENV
process.env.NODE_ENV = "test";
