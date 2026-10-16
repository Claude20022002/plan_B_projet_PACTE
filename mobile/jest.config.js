const path = require('path');

/** Extends jest-expo preset so Babel transforms shared/ modules alongside mobile/src/. */
const expo = require('jest-expo/jest-preset');
const workspaceRoot = path.resolve(__dirname, '..');

const transform = { ...expo.transform };
const babelKey = Object.keys(transform).find((k) => k.includes('jt]sx'));
if (babelKey && Array.isArray(transform[babelKey])) {
    const opts = { ...transform[babelKey][1] };
    delete opts.extends;
    transform[babelKey] = [transform[babelKey][0], { ...opts, root: workspaceRoot, babelrcRoots: [workspaceRoot], configFile: path.resolve(__dirname, 'babel.config.js') }];
}

module.exports = {
    ...expo,
    roots: ['<rootDir>/__tests__'],
    moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
    extensionsToTreatAsEsm: [],
    resolver: '<rootDir>/jest.resolver.js',
    setupFiles: ['<rootDir>/jest.esm-fix.js', ...(expo.setupFiles || [])],
    transform,
};
