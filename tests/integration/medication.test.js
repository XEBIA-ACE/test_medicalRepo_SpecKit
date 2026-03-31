/**
 * Medication API Integration Tests
 */

const request = require('supertest');
const { Sequelize } = require('sequelize');
const App = require('../../src/app');
const MedicationModel = require('../../src/models/Medication');
const { generateToken } = require('../../src/middleware/auth');

describe('Medication API Integration Tests', () => {
  let app;
  let server;
  let sequelize;
  let Medication;
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Setup test database
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });

    // Mock database connection
    jest.doMock('../../src/config/database', () => ({
      connect: jest.fn().mockResolvedValue(sequelize),
      sync: jest.fn().mockResolvedValue(),
      close: jest.fn().mockResolvedValue(),
      getModel: jest.fn().mockImplementation((modelName) => {
        if (modelName === 'Medication') return Medication;
        return null;
      })
    }));

    // Initialize models
    Medication = MedicationModel(sequelize);
    await sequelize.sync();

    // Create app instance
    const AppClass = require('../../src/app');
    app = new AppClass().app;

    // Generate test auth token
    testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    authToken = generateToken({ 
      userId: testUserId, 
      email: 'test@example.com',
      role: 'user'
    });
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  beforeEach(async () => {
    await Medication.destroy({ where: {}, truncate: true });
  });

  const validMedicationData = {
    name: 'Aspirin',
    dosage: '100mg',
    schedule: ['08:00', '20:00']
  };

  describe('POST /api/medications', () => {
    test('should create medication with valid data', async () => {
      const response = await request(app)
        .post('/api/medications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validMedicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Aspirin');
      expect(response.body.data.dosage).toBe('100mg');
      expect(response.body.data.schedule).toEqual(['08:00', '20:00']);
      expect(response.body.data.userId).toBe(testUserId);
      expect(response.body.message).toBe('Medication created successfully');
    });

    test('should return 400 for invalid data', async () => {
      const invalidData = { ...validMedicationData, name: '' };

      const response = await request(app)
        .post('/api/medications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Field \'name\' must be at least 1 characters long');
    });

    test('should return 401 without auth token', async () => {
      await request(app)
        .post('/api/medications')
        .send(validMedicationData)
        .expect(401);
    });

    test('should return 400 for invalid schedule format', async () => {
      const invalidData = { ...validMedicationData, schedule: ['25:00'] };

      const response = await request(app)
        .post('/api/medications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/medications', () => {
    beforeEach(async () => {
      // Create test medications
      await Medication.bulkCreate([
        { ...validMedicationData, name: 'Medication 1', userId: testUserId },
        { ...validMedicationData, name: 'Medication 2', userId: testUserId },
        { ...validMedicationData, name: 'Medication 3', userId: testUserId }
      ]);
    });

    test('should return user medications with pagination', async () => {
      const response = await request(app)
        .get('/api/medications?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.totalCount).toBe(3);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.hasNextPage).toBe(true);
    });

    test('should return empty array for user with no medications', async () => {
      await Medication.destroy({ where: {} });

      const response = await request(app)
        .get('/api/medications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.totalCount).toBe(0);
    });

    test('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/medications')
        .expect(401);
    });
  });

  describe('GET /api/medications/:id', () => {
    let medicationId;

    beforeEach(async () => {
      const medication = await Medication.create({
        ...validMedicationData,
        userId: testUserId
      });
      medicationId = medication.id;
    });

    test('should return specific medication', async () => {
      const response = await request(app)
        .get(`/api/medications/${medicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(medicationId);
      expect(response.body.data.name).toBe('Aspirin');
    });

    test('should return 404 for non-existent medication', async () => {
      const response = await request(app)
        .get('/api/medications/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Medication not found');
    });

    test('should return 401 without auth token', async () => {
      await request(app)
        .get(`/api/medications/${medicationId}`)
        .expect(401);
    });
  });

  describe('PUT /api/medications/:id', () => {
    let medicationId;

    beforeEach(async () => {
      const medication = await Medication.create({
        ...validMedicationData,
        userId: testUserId
      });
      medicationId = medication.id;
    });

    test('should update medication successfully', async () => {
      const updateData = { name: 'Updated Aspirin', dosage: '200mg' };

      const response = await request(app)
        .put(`/api/medications/${medicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Aspirin');
      expect(response.body.data.dosage).toBe('200mg');
      expect(response.body.message).toBe('Medication updated successfully');
    });

    test('should return 404 for non-existent medication', async () => {
      const response = await request(app)
        .put('/api/medications/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('Medication not found');
    });

    test('should return 400 for invalid update data', async () => {
      const response = await request(app)
        .put(`/api/medications/${medicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ schedule: ['25:00'] })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/medications/:id', () => {
    let medicationId;

    beforeEach(async () => {
      const medication = await Medication.create({
        ...validMedicationData,
        userId: testUserId
      });
      medicationId = medication.id;
    });

    test('should delete medication successfully', async () => {
      const response = await request(app)
        .delete(`/api/medications/${medicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Medication deleted successfully');

      // Verify medication is deleted
      await request(app)
        .get(`/api/medications/${medicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should return 404 for non-existent medication', async () => {
      const response = await request(app)
        .delete('/api/medications/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Medication not found');
    });
  });

  describe('GET /api/medications/search', () => {
    beforeEach(async () => {
      await Medication.bulkCreate([
        { ...validMedicationData, name: 'Aspirin', userId: testUserId },
        { ...validMedicationData, name: 'Ibuprofen', userId: testUserId },
        { ...validMedicationData, name: 'Acetaminophen', userId: testUserId }
      ]);
    });

    test('should search medications by name', async () => {
      const response = await request(app)
        .get('/api/medications/search?q=aspirin')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Aspirin');
      expect(response.body.pagination.searchTerm).toBe('aspirin');
    });

    test('should return 400 without search term', async () => {
      const response = await request(app)
        .get('/api/medications/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBe('Search term is required');
    });

    test('should return empty results for no matches', async () => {
      const response = await request(app)
        .get('/api/medications/search?q=nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/medications/schedule', () => {
    beforeEach(async () => {
      await Medication.bulkCreate([
        { ...validMedicationData, name: 'Morning Med', schedule: ['08:00'], userId: testUserId },
        { ...validMedicationData, name: 'Afternoon Med', schedule: ['14:00'], userId: testUserId },
        { ...validMedicationData, name: 'Evening Med', schedule: ['20:00'], userId: testUserId }
      ]);
    });

    test('should return medications within time range', async () => {
      const response = await request(app)
        .get('/api/medications/schedule?start=07:00&end=15:00')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.timeRange).toEqual({ start: '07:00', end: '15:00' });
      
      const names = response.body.data.map(m => m.name);
      expect(names).toContain('Morning Med');
      expect(names).toContain('Afternoon Med');
      expect(names).not.toContain('Evening Med');
    });

    test('should return 400 without time parameters', async () => {
      const response = await request(app)
        .get('/api/medications/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBe('Time range required');
    });

    test('should return 400 with invalid time format', async () => {
      const response = await request(app)
        .get('/api/medications/schedule?start=25:00&end=26:00')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid time format');
    });
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('Medication Repository Service');
    });
  });
});