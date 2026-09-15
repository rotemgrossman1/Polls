const { TextEncoder, TextDecoder } = require('util');

// jsdom lacks TextEncoder/TextDecoder, which React Router needs.
Object.assign(global, { TextEncoder, TextDecoder });

require('@testing-library/jest-dom');
