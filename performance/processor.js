/**
 * Artillery.js Processor
 * Custom functions for performance testing
 */

const { faker } = require('@faker-js/faker');

module.exports = {
  // Generate random medication names
  randomMedicationName: function(context, events, done) {
    context.vars.medicationName = faker.commerce.productName();
    return done();
  },

  // Generate random dosage
  randomDosage: function(context, events, done) {
    const amount = faker.datatype.number({ min: 50, max: 1000 });
    const unit = faker.helpers.arrayElement(['mg', 'ml', 'tablets', 'capsules']);
    context.vars.dosage = `${amount}${unit}`;
    return done();
  },

  // Generate random schedule
  randomSchedule: function(context, events, done) {
    const times = [];
    const numTimes = faker.datatype.number({ min: 1, max: 4 });
    
    for (let i = 0; i < numTimes; i++) {
      const hour = faker.datatype.number({ min: 6, max: 22 });
      const minute = faker.helpers.arrayElement(['00', '15', '30', '45']);
      times.push(`${hour.toString().padStart(2, '0')}:${minute}`);
    }
    
    context.vars.schedule = times.sort();
    return done();
  },

  // Log response times for analysis
  logResponseTime: function(requestParams, response, context, ee, next) {
    if (response.timings) {
      const responseTime = response.timings.response;
      console.log(`Response time: ${responseTime}ms for ${requestParams.url}`);
      
      // Log warning if response time exceeds 500ms
      if (responseTime > 500) {
        console.warn(`⚠️  Slow response: ${responseTime}ms for ${requestParams.url}`);
      }
    }
    return next();
  },

  // Custom validation for response times
  validateResponseTime: function(requestParams, response, context, ee, next) {
    if (response.timings && response.timings.response > 500) {
      ee.emit('error', new Error(`Response time ${response.timings.response}ms exceeds 500ms threshold`));
    }
    return next();
  },

  // Setup test data
  setupTestData: function(context, events, done) {
    // Create some test medications for consistent testing
    context.vars.testMedications = [
      {
        name: 'Aspirin',
        dosage: '100mg',
        schedule: ['08:00', '20:00']
      },
      {
        name: 'Ibuprofen',
        dosage: '200mg',
        schedule: ['12:00']
      },
      {
        name: 'Vitamin D',
        dosage: '1000 IU',
        schedule: ['09:00']
      }
    ];
    return done();
  }
};