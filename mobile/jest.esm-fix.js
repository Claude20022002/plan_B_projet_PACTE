/**
 * Disables Jest's native ESM detection so shared/ files (type:"module") go
 * through the Babel transform pipeline instead of Node's ESM loader.
 */
const vm = require('vm');
Object.defineProperty(vm, 'SyntheticModule', { value: undefined, configurable: true });
Object.defineProperty(vm, 'SourceTextModule', { value: undefined, configurable: true });
