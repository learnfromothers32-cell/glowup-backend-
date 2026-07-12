/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/services/trending.service.ts',
    'src/controllers/trending.controller.ts',
    'src/utils/token.ts',
    'src/middleware/auth.middleware.ts',
    'src/middleware/validate.ts',
    'src/middleware/rateLimiter.ts',
    'src/controllers/auth.controller.ts',
    'src/controllers/booking.controller.ts',
    'src/controllers/payment.controller.ts',
    'src/services/user.service.ts',
    '!src/**/*.test.ts',
  ],
  coverageReporters: ['text', 'lcov'],
};
