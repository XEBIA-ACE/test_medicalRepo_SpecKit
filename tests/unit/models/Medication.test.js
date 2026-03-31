/**
 * Medication Model Tests
 */

const { Sequelize, DataTypes } = require('sequelize');
const MedicationModel = require('../../src/models/Medication');

describe('Medication Model', () => {
  let sequelize;
  let Medication;

  beforeAll(async () => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });

    Medication = MedicationModel(sequelize);
    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Medication.destroy({ where: {}, truncate: true });
  });

  describe('Model Definition', () => {
    test('should have correct attributes', () => {
      const attributes = Medication.getTableName();
      expect(attributes).toBe('medications');
      
      const modelAttributes = Medication.rawAttributes;
      expect(modelAttributes).toHaveProperty('id');
      expect(modelAttributes).toHaveProperty('name');
      expect(modelAttributes).toHaveProperty('dosage');
      expect(modelAttributes).toHaveProperty('schedule');
      expect(modelAttributes).toHaveProperty('userId');
    });

    test('should have correct data types', () => {
      const attributes = Medication.rawAttributes;
      expect(attributes.id.type).toBeInstanceOf(DataTypes.UUID);
      expect(attributes.name.type).toBeInstanceOf(DataTypes.STRING);
      expect(attributes.dosage.type).toBeInstanceOf(DataTypes.STRING);
      expect(attributes.schedule.type).toBeInstanceOf(DataTypes.JSON);
      expect(attributes.userId.type).toBeInstanceOf(DataTypes.UUID);
    });
  });

  describe('Validation', () => {
    const validMedicationData = {
      name: 'Aspirin',
      dosage: '100mg',
      schedule: ['08:00', '20:00'],
      userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    };

    test('should create medication with valid data', async () => {
      const medication = await Medication.create(validMedicationData);
      
      expect(medication.id).toBeDefined();
      expect(medication.name).toBe('Aspirin');
      expect(medication.dosage).toBe('100mg');
      expect(medication.schedule).toEqual(['08:00', '20:00']);
      expect(medication.userId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    test('should fail validation with empty name', async () => {
      const invalidData = { ...validMedicationData, name: '' };
      
      await expect(Medication.create(invalidData))
        .rejects
        .toThrow();
    });

    test('should fail validation with empty dosage', async () => {
      const invalidData = { ...validMedicationData, dosage: '' };
      
      await expect(Medication.create(invalidData))
        .rejects
        .toThrow();
    });

    test('should fail validation with empty schedule', async () => {
      const invalidData = { ...validMedicationData, schedule: [] };
      
      await expect(Medication.create(invalidData))
        .rejects
        .toThrow();
    });

    test('should fail validation with invalid time format', async () => {
      const invalidData = { ...validMedicationData, schedule: ['25:00'] };
      
      await expect(Medication.create(invalidData))
        .rejects
        .toThrow();
    });

    test('should fail validation with non-array schedule', async () => {
      const invalidData = { ...validMedicationData, schedule: 'not-an-array' };
      
      await expect(Medication.create(invalidData))
        .rejects
        .toThrow();
    });

    test('should fail validation without userId', async () => {
      const invalidData = { ...validMedicationData };
      delete invalidData.userId;
      
      await expect(Medication.create(invalidData))
        .rejects
        .toThrow();
    });
  });

  describe('Database Operations', () => {
    test('should update medication', async () => {
      const medication = await Medication.create({
        name: 'Aspirin',
        dosage: '100mg',
        schedule: ['08:00'],
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      });

      await medication.update({
        name: 'Updated Aspirin',
        dosage: '200mg'
      });

      expect(medication.name).toBe('Updated Aspirin');
      expect(medication.dosage).toBe('200mg');
    });

    test('should delete medication', async () => {
      const medication = await Medication.create({
        name: 'Aspirin',
        dosage: '100mg',
        schedule: ['08:00'],
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      });

      await medication.destroy();
      
      const found = await Medication.findByPk(medication.id);
      expect(found).toBeNull();
    });

    test('should find medications by userId', async () => {
      const userId1 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const userId2 = 'f47ac10b-58cc-4372-a567-0e02b2c3d480';

      await Medication.create({
        name: 'Medication 1',
        dosage: '100mg',
        schedule: ['08:00'],
        userId: userId1
      });

      await Medication.create({
        name: 'Medication 2',
        dosage: '200mg',
        schedule: ['09:00'],
        userId: userId2
      });

      const user1Medications = await Medication.findAll({ where: { userId: userId1 } });
      const user2Medications = await Medication.findAll({ where: { userId: userId2 } });

      expect(user1Medications).toHaveLength(1);
      expect(user2Medications).toHaveLength(1);
      expect(user1Medications[0].name).toBe('Medication 1');
      expect(user2Medications[0].name).toBe('Medication 2');
    });
  });
});