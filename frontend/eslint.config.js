import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // MIGRATION_EXAMPLE.jsx : exemple de documentation (jamais importé), pas du code de l'application
  globalIgnores(['dist', 'src/hooks/api/_shared/MIGRATION_EXAMPLE.jsx']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Majuscule ou « motion » : composant utilisé en JSX (<Icon />, <motion.div>), que la règle de
      // base ne lit pas ; « _ » : ignoré exprès
      'no-unused-vars': ['error', { varsIgnorePattern: '^([A-Z_]|motion$)', argsIgnorePattern: '^[A-Z_]' }],
      // Un contexte exporte son Provider et le hook qui le lit : le rechargement à chaud reste correct
      'react-refresh/only-export-components': ['error', { allowConstantExport: true, allowExportNames: ['useAuth', 'useToast'] }],
    },
  },
  {
    // Fichiers de configuration et scripts exécutés par Node (pas par le navigateur)
    files: ['*.config.js', 'scripts/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
  },
])
