import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
    baseUrl: 'http://localhost:3000',
    supportFile: 'src/support/e2e.ts',
    specPattern: 'src/e2e/**/*.cy.{js,jsx,ts,tsx}',
    videosFolder: 'dist/cypress/videos',
    screenshotsFolder: 'dist/cypress/screenshots',
  },
});