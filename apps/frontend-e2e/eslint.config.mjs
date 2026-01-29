import baseConfig from '@repo/eslint-config/base';

export default [
  ...baseConfig,
  {
    files: ['**/*.cy.ts', '**/*.cy.js'],
    rules: {
      // Disable problematic Cypress rules for now
    },
  },
];
