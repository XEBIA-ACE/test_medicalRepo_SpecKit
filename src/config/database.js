/**
 * Database Configuration and Connection Setup
 */

const { Sequelize } = require('sequelize');
const MedicationModel = require('../models/Medication');

class Database {
  constructor() {
    this.sequelize = null;
    this.models = {};
  }

  async connect() {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'medication_repository',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };

    this.sequelize = new Sequelize(config);

    // Test connection
    try {
      await this.sequelize.authenticate();
      console.log('Database connection established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }

    // Initialize models
    this.models.Medication = MedicationModel(this.sequelize);

    return this.sequelize;
  }

  async sync(options = {}) {
    if (!this.sequelize) {
      throw new Error('Database not connected. Call connect() first.');
    }

    try {
      await this.sequelize.sync(options);
      console.log('Database synchronized successfully.');
    } catch (error) {
      console.error('Database synchronization failed:', error);
      throw error;
    }
  }

  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('Database connection closed.');
    }
  }

  getModel(modelName) {
    return this.models[modelName];
  }
}

module.exports = new Database();