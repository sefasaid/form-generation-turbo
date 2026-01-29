module.exports = {
  displayName: '@repo/api',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
          tsx: false,
        },
        target: 'es2021',
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: '../../dist/test-output/jest/coverage',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
  ],
  moduleNameMapper: {
    '^@repo/prisma$': '<rootDir>/../../packages/prisma/src',
    '^@repo/prisma-module$': '<rootDir>/../../packages/prisma/src',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
