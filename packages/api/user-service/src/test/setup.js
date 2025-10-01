// Test setup for Jest
const { sequelize } = require('../config/database')

// Setup test database
beforeAll(async () => {
  // Use in-memory SQLite for tests
  process.env.NODE_ENV = 'test'
  process.env.DB_DIALECT = 'sqlite'
  process.env.DB_STORAGE = ':memory:'
  
  // Sync database
  await sequelize.sync({ force: true })
})

// Clean up after each test
afterEach(async () => {
  // Clear all tables
  const models = Object.values(sequelize.models)
  for (const model of models) {
    await model.destroy({ where: {}, force: true })
  }
})

// Close database connection after all tests
afterAll(async () => {
  await sequelize.close()
})

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' }))
  }))
}))

// Set test timeout
jest.setTimeout(30000)
