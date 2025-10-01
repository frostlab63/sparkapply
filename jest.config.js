module.exports = {
  projects: [
    {
      displayName: 'Backend Tests',
      testMatch: ['<rootDir>/packages/api/user-service/src/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/packages/api/user-service/src/test/setup.js'],
      collectCoverageFrom: [
        '<rootDir>/packages/api/user-service/src/**/*.js',
        '!<rootDir>/packages/api/user-service/src/index.js',
        '!<rootDir>/packages/api/user-service/src/config/database.js',
        '!<rootDir>/packages/api/user-service/src/test/**',
      ],
      coverageDirectory: '<rootDir>/coverage/backend',
      coverageReporters: ['text', 'lcov', 'html'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/packages/api/user-service/src/$1',
      },
    },
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
