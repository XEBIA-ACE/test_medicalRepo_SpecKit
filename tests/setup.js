/**
 * Test Setup
 * Global test configuration and utilities
 */

const { Sequelize } = require('sequelize');

// Test database configuration
const testDb = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

// Global test utilities
global.testDb = testDb;
global.testUser = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  email: 'test@example.com',
  role: 'user'
};

// Setup and teardown
beforeAll(async () => {
  // Initialize test database
  await testDb.authenticate();
});

afterAll(async () => {
  // Close test database
  await testDb.close();
});

// Mock JWT for testing
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(() => global.testUser),
  sign: jest.fn(() => 'mock-jwt-token')
}));

// Suppress console.log in tests unless explicitly needed
const originalConsoleLog = console.log;
console.log = (...args) => {
  if (process.env.VERBOSE_TESTS) {
    originalConsoleLog(...args);
  }
};