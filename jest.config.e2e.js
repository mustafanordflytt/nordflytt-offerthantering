/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-puppeteer',
  testMatch: ['**/e2e-tests/**/*.test.js'],
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/e2e-tests/setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }]
      ]
    }]
  },
  testEnvironment: 'jest-environment-puppeteer',
  globals: {
    URL: 'http://localhost:3000'
  },
  verbose: true,
  collectCoverage: false,
  coverageDirectory: 'coverage-e2e',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**'
  ]
};