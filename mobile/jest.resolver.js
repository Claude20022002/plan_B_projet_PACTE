const path = require('path');
const rnResolver = require('@react-native/jest-preset/jest/resolver');

const SHARED = path.resolve(__dirname, '..', 'shared');

/** Delegates to React Native resolver but forces CJS for shared ESM packages. */
module.exports = (request, options) => rnResolver(request, options);

module.exports.unstable_shouldLoadAsEsm = (modulePath) => {
    if (modulePath.startsWith(SHARED)) return false;
    return false;
};
