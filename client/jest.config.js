module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.js'],
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    // apiConfig reads import.meta.env, which Jest cannot parse.
    '^(.*/)?apiConfig(\\.js)?$': '<rootDir>/test/apiConfigStub.js',
  },
  clearMocks: true,
};
