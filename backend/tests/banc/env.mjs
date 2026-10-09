/**
 * Environnement du banc des requêtes, importé en premier par ses scripts (avant config/db.js) :
 * mêmes valeurs par défaut que les tests d'intégration, sur la base dédiée hestim_bench_test.
 * La CI surcharge l'accès à MySQL (DB_HOST, DB_PORT, DB_PASSWORD).
 */
if (process.env.DB_NAME === undefined) process.env.DB_NAME = "hestim_bench_test";
await import("../integration/setupEnv.js");

// Le banc mesure les requêtes des routes, pas la connexion : sans cela, chaque route admin
// répond 403 (double authentification à configurer) et n'est plus mesurée
process.env.MFA_ADMINS_OBLIGATOIRE = "false";

if (!String(process.env.DB_NAME).endsWith("_test")) throw new Error("Banc réservé à une base *_test");
