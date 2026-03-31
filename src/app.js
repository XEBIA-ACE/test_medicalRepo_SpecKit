/**
 * Main Application Server
 * Express.js server setup with middleware and route configuration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const database = require('./config/database');
const medicationRoutes = require('./routes/medicationRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

class App {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Medication Repository Service',
        version: process.env.npm_package_version || '1.0.0'
      });
    });
  }

  setupRoutes() {
    // API routes with authentication
    this.app.use('/api/medications', authMiddleware, medicationRoutes);

    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.json({
        service: 'Medication Repository Service',
        version: '1.0.0',
        endpoints: {
          'GET /health': 'Health check',
          'GET /api/medications': 'Get user medications',
          'POST /api/medications': 'Create new medication',
          'GET /api/medications/:id': 'Get specific medication',
          'PUT /api/medications/:id': 'Update medication',
          'DELETE /api/medications/:id': 'Delete medication',
          'GET /api/medications/search': 'Search medications'
        }
      });
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Connect to database
      await database.connect();
      
      // Sync database (create tables if they don't exist)
      await database.sync({ alter: process.env.NODE_ENV === 'development' });

      // Start server
      this.server = this.app.listen(this.port, () => {
        console.log(`Medication Repository Service running on port ${this.port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Health check: http://localhost:${this.port}/health`);
      });

      return this.server;
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop() {
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
    }
    await database.close();
    console.log('Server stopped gracefully');
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (global.app) {
    await global.app.stop();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (global.app) {
    await global.app.stop();
  }
  process.exit(0);
});

module.exports = App;