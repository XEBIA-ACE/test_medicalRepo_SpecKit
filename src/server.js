/**
 * Server Entry Point
 * Starts the Medication Repository Service
 */

const App = require('./app');

// Create and start the application
const app = new App();

// Store globally for graceful shutdown
global.app = app;

// Start the server
app.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});