/**
 * Medication Service Tests
 */

const { Sequelize } = require('sequelize');
const MedicationService = require('../../src/services/MedicationService');
const MedicationModel = require('../../src/models/Medication');

describe('MedicationService', () => {
  let sequelize;
  let Medication;
  let medicationService;

  beforeAll(async () => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });

    Medication = MedicationModel(sequelize);
    medicationService = new MedicationService(Medication);
    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Medication.destroy({ where: {}, truncate: true });
  });

  const validMedicationData = {
    name: 'Aspirin',
    dosage: '100mg',
    schedule: ['08:00', '20:00'],
    userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  };

  describe('createMedication', () => {
    test('should create medication with valid data', async () => {
      const medication = await medicationService.createMedication(validMedicationData);
      
      expect(medication.id).toBeDefined();
      expect(medication.name).toBe('Aspirin');
      expect(medication.dosage).toBe('100mg');
      expect(medication.schedule).toEqual(['08:00', '20:00']);
    });

    test('should throw error with invalid data', async () => {
      const invalidData = { ...validMedicationData, name: '' };
      
      await expect(medicationService.createMedication(invalidData))
        .rejects
        .toThrow('Validation error');
    });
  });

  describe('getMedicationsByUserId', () => {
    beforeEach(async () => {
      // Create test medications
      await Medication.bulkCreate([
        { ...validMedicationData, name: 'Medication 1' },
        { ...validMedicationData, name: 'Medication 2' },
        { ...validMedicationData, name: 'Medication 3' }
      ]);
    });

    test('should return paginated medications for user', async () => {
      const result = await medicationService.getMedicationsByUserId(
        validMedicationData.userId,
        { page: 1, limit: 2 }
      );

      expect(result.medications).toHaveLength(2);
      expect(result.totalCount).toBe(3);
      expect(result.totalPages).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
    });

    test('should return empty array for non-existent user', async () => {
      const result = await medicationService.getMedicationsByUserId('non-existent-user');
      
      expect(result.medications).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    test('should handle sorting options', async () => {
      const result = await medicationService.getMedicationsByUserId(
        validMedicationData.userId,
        { sortBy: 'name', sortOrder: 'ASC' }
      );

      expect(result.medications[0].name).toBe('Medication 1');
      expect(result.medications[1].name).toBe('Medication 2');
    });
  });

  describe('getMedicationById', () => {
    test('should return medication by id and userId', async () => {
      const created = await medicationService.createMedication(validMedicationData);
      const found = await medicationService.getMedicationById(created.id, validMedicationData.userId);
      
      expect(found.id).toBe(created.id);
      expect(found.name).toBe('Aspirin');
    });

    test('should throw error for non-existent medication', async () => {
      await expect(
        medicationService.getMedicationById('non-existent-id', validMedicationData.userId)
      ).rejects.toThrow('Medication not found');
    });

    test('should throw error for wrong user', async () => {
      const created = await medicationService.createMedication(validMedicationData);
      
      await expect(
        medicationService.getMedicationById(created.id, 'wrong-user-id')
      ).rejects.toThrow('Medication not found');
    });
  });

  describe('updateMedication', () => {
    test('should update medication successfully', async () => {
      const created = await medicationService.createMedication(validMedicationData);
      const updateData = { name: 'Updated Aspirin', dosage: '200mg' };
      
      const updated = await medicationService.updateMedication(
        created.id,
        validMedicationData.userId,
        updateData
      );

      expect(updated.name).toBe('Updated Aspirin');
      expect(updated.dosage).toBe('200mg');
      expect(updated.schedule).toEqual(['08:00', '20:00']); // unchanged
    });

    test('should throw error for non-existent medication', async () => {
      await expect(
        medicationService.updateMedication('non-existent-id', validMedicationData.userId, {})
      ).rejects.toThrow('Medication not found');
    });
  });

  describe('deleteMedication', () => {
    test('should delete medication successfully', async () => {
      const created = await medicationService.createMedication(validMedicationData);
      
      const result = await medicationService.deleteMedication(created.id, validMedicationData.userId);
      
      expect(result.message).toBe('Medication deleted successfully');
      
      await expect(
        medicationService.getMedicationById(created.id, validMedicationData.userId)
      ).rejects.toThrow('Medication not found');
    });

    test('should throw error for non-existent medication', async () => {
      await expect(
        medicationService.deleteMedication('non-existent-id', validMedicationData.userId)
      ).rejects.toThrow('Medication not found');
    });
  });

  describe('searchMedications', () => {
    beforeEach(async () => {
      await Medication.bulkCreate([
        { ...validMedicationData, name: 'Aspirin' },
        { ...validMedicationData, name: 'Ibuprofen' },
        { ...validMedicationData, name: 'Acetaminophen' }
      ]);
    });

    test('should search medications by name', async () => {
      const result = await medicationService.searchMedications(
        validMedicationData.userId,
        'aspirin'
      );

      expect(result.medications).toHaveLength(1);
      expect(result.medications[0].name).toBe('Aspirin');
      expect(result.searchTerm).toBe('aspirin');
    });

    test('should return empty results for no matches', async () => {
      const result = await medicationService.searchMedications(
        validMedicationData.userId,
        'nonexistent'
      );

      expect(result.medications).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    test('should handle case-insensitive search', async () => {
      const result = await medicationService.searchMedications(
        validMedicationData.userId,
        'ASPIRIN'
      );

      expect(result.medications).toHaveLength(1);
      expect(result.medications[0].name).toBe('Aspirin');
    });
  });

  describe('getMedicationsBySchedule', () => {
    beforeEach(async () => {
      await Medication.bulkCreate([
        { ...validMedicationData, name: 'Morning Med', schedule: ['08:00'] },
        { ...validMedicationData, name: 'Afternoon Med', schedule: ['14:00'] },
        { ...validMedicationData, name: 'Evening Med', schedule: ['20:00'] },
        { ...validMedicationData, name: 'All Day Med', schedule: ['08:00', '14:00', '20:00'] }
      ]);
    });

    test('should return medications within time range', async () => {
      const medications = await medicationService.getMedicationsBySchedule(
        validMedicationData.userId,
        '07:00',
        '15:00'
      );

      expect(medications).toHaveLength(3); // Morning, Afternoon, and All Day
      const names = medications.map(m => m.name);
      expect(names).toContain('Morning Med');
      expect(names).toContain('Afternoon Med');
      expect(names).toContain('All Day Med');
      expect(names).not.toContain('Evening Med');
    });

    test('should return empty array for no matches', async () => {
      const medications = await medicationService.getMedicationsBySchedule(
        validMedicationData.userId,
        '01:00',
        '02:00'
      );

      expect(medications).toHaveLength(0);
    });
  });

  describe('validateMedicationData', () => {
    test('should return empty array for valid data', () => {
      const errors = medicationService.validateMedicationData(validMedicationData);
      expect(errors).toHaveLength(0);
    });

    test('should return errors for missing required fields', () => {
      const invalidData = {};
      const errors = medicationService.validateMedicationData(invalidData);
      
      expect(errors).toContain('Name is required and must be a non-empty string');
      expect(errors).toContain('Dosage is required and must be a non-empty string');
      expect(errors).toContain('Schedule is required and must be a non-empty array');
      expect(errors).toContain('UserId is required and must be a valid UUID string');
    });

    test('should return errors for invalid schedule format', () => {
      const invalidData = {
        ...validMedicationData,
        schedule: ['25:00', 'invalid-time']
      };
      const errors = medicationService.validateMedicationData(invalidData);
      
      expect(errors).toContain('Schedule time at index 0 must be in HH:MM format');
      expect(errors).toContain('Schedule time at index 1 must be in HH:MM format');
    });

    test('should return error for empty schedule array', () => {
      const invalidData = {
        ...validMedicationData,
        schedule: []
      };
      const errors = medicationService.validateMedicationData(invalidData);
      
      expect(errors).toContain('Schedule is required and must be a non-empty array');
    });
  });
});