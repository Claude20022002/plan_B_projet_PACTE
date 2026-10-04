const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/**
 * La logique des séances, les jetons de design et les traductions communes vivent dans
 * ../shared (partagés avec le frontend web) : Metro doit surveiller et résoudre ce dossier.
 * Il n'a aucune dépendance : React et React Native ne sont jamais dupliqués.
 */
const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.resolve(projectRoot, '../shared')];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

module.exports = config;
