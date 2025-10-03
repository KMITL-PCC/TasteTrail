/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: "ts-jest",

  // Set the test environment to Node.js
  testEnvironment: "node",

  // Where to look for test files
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.interface.ts",
  ],

  // Coverage thresholds - tests fail if coverage is too low
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage output formats
  coverageReporters: [
    "text", // Shows in terminal
    "text-summary", // Short summary in terminal
    "html", // Creates HTML report
    "lcov", // For CI/CD tools
  ],

  // Module path aliases (adjust based on your tsconfig.json)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Clear mocks between tests automatically
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Transform files with ts-jest
  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  // Increase timeout for database operations
  testTimeout: 10000,
};
