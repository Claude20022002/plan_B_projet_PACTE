import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * ESLint du backend (lots A-4 et Q-1) : mêmes règles de base que le site (frontend/eslint.config.js).
 * Une erreur fait échouer la CI. La longueur des fichiers n'est qu'un avertissement : elle signale
 * les fichiers à découper (docs/plans/assainissement.md, § 6, « Règles de code ») sans rien bloquer.
 */
const longueur = (max) => ["warn", { max, skipBlankLines: true, skipComments: true }];

/**
 * Accès à la base (revue d'expert, fichier 16, A-2 et R-2) : avec plusieurs écoles, chaque requête
 * lira les modèles de son école (ME-3a, D-03). Le code passe donc par models/index.js pour les
 * modèles et par models/acces.js pour une transaction ou une requête SQL, jamais par la connexion
 * (config/db.js) ; un modèle n'en importe pas un autre (index.js les relie). Les fichiers
 * qui le font déjà sont figés ici, le 29 octobre 2026 : la liste ne fait que raccourcir, ME-3a la
 * reprendra. Hors règle : modèles, migrations, tests et points d'entrée (server.js, seed.js), qui
 * ouvrent ou préparent la connexion eux-mêmes.
 */
const CONNEXION_DEJA_IMPORTEE = [
    "controllers/calendrierController.js",
    "controllers/coursController.js",
    "controllers/creneauController.js",
    "controllers/enseignantController.js",
    "controllers/enseignementController.js",
    "controllers/salleController.js",
    "controllers/statistiquesController.js",
    "controllers/userController.js",
    "services/annonces/annonces.js",
    "services/desactivation/anonymisation.js",
    "services/desactivation/desactivation.js",
    "services/desactivation/programmation.js",
    "services/generation/SnapshotService.js",
    "services/generation/timefold/deploiement.js",
    "services/mfa.js",
    "services/planning/enseignements.js",
    "services/planning/examens.js",
    "services/planning/imprevus.js",
    "services/planning/reservations.js",
    "services/planning/seances.js",
    "services/quiz/parties.js",
    "services/studio/questionnaires.js",
    "services/studio/tentatives.js",
    "services/taches/periodiques.js", // nomme son verrou d'après la base : à reprendre avec ME-3a
];
const MODELE_DEJA_IMPORTE = ["models/Groupe.js"]; // AnneeUniversitaire (ME-18)

const interdire = (regex, message) => ["error", { patterns: [{ regex, message }] }];

export default defineConfig([
    globalIgnores(["node_modules", "coverage", "storage"]),
    {
        files: ["**/*.{js,mjs}"],
        extends: [js.configs.recommended],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.node,
        },
        rules: {
            // « _ » en tête : variable ou paramètre ignoré exprès (signature imposée par Express).
            // « const { a, ...reste } = objet » : écarter un champ est un usage, pas un oubli.
            "no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", ignoreRestSiblings: true }],
            // Repère : 300 lignes par fichier, hors lignes vides et commentaires
            "max-lines": longueur(300),
        },
    },
    {
        // Un contrôleur lit la requête et répond ; la règle métier vit dans services/ : 200 lignes
        files: ["controllers/**/*.js"],
        rules: { "max-lines": longueur(200) },
    },
    {
        files: ["tests/**/*.{js,mjs}"],
        languageOptions: { globals: { ...globals.node, ...globals.jest } },
    },
    {
        files: ["**/*.{js,mjs}"],
        ignores: ["models/**", "migrations/**", "tests/**", "server.js", "seed.js", ...CONNEXION_DEJA_IMPORTEE],
        rules: {
            "no-restricted-imports": interdire(
                "(^|/)config/db(\\.js)?$",
                "Pas de connexion directe : les modèles viennent de models/index.js, une transaction ou une requête SQL de models/acces.js (enTransaction, requete). Avec plusieurs écoles, la connexion dépendra de la requête (ME-3a, R-2).",
            ),
        },
    },
    {
        files: ["models/**/*.js"],
        ignores: ["models/index.js", ...MODELE_DEJA_IMPORTE],
        rules: {
            "no-restricted-imports": interdire(
                "^\\./",
                "Un modèle n'importe pas un autre modèle : les relations se déclarent dans models/index.js (ME-3a, R-2).",
            ),
        },
    },
]);
