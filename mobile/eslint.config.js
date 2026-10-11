// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Règles de code (assainissement.md, § 6, lot Q-2) : un fichier trop long est signalé, sans
    // bloquer ; le dictionnaire de traduction (src/i18n.js) est une donnée, pas du code à découper
    ignores: ["src/i18n.js"],
    rules: {
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
]);
