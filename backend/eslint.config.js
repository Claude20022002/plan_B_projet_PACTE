import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * ESLint du backend (lots A-4 et Q-1) : mêmes règles de base que le site (frontend/eslint.config.js).
 * Une erreur fait échouer la CI. La longueur des fichiers n'est qu'un avertissement : elle signale
 * les fichiers à découper (docs/plans/assainissement.md, § 6, « Règles de code ») sans rien bloquer.
 */
const longueur = (max) => ["warn", { max, skipBlankLines: true, skipComments: true }];

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
]);
