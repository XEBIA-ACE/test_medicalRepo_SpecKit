/**
 * Medication Service
 * Business logic for medication management operations
 */

const { Op } = require('sequelize');

class MedicationService {
  constructor(medicationModel) {
    this.Medication = medicationModel;
  }

  /**
   * Create a new medication record
   */
  async createMedication(medicationData) {
    try {
      const medication = await this.Medication.create(medicationData);
      return medication;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Get all medications for a specific user
   */
  async getMedicationsByUserId(userId, options = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    try {
      const result = await this.Medication.findAndCountAll({
        where: { userId },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]],
      });

      return {
        medications: result.rows,
        totalCount: result.count,
        totalPages: Math.ceil(result.count / limit),
        currentPage: parseInt(page),
        hasNextPage: page * limit < result.count,
        hasPreviousPage: page > 1
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific medication by ID and user ID
   */
  async getMedicationById(id, userId) {
    try {
      const medication = await this.Medication.findOne({
        where: { id, userId }
      });

      if (!medication) {
        throw new Error('Medication not found');
      }

      return medication;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a medication record
   */
  async updateMedication(id, userId, updateData) {
    try {
      const medication = await this.getMedicationById(id, userId);
      
      const updatedMedication = await medication.update(updateData);
      return updatedMedication;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Delete a medication record
   */
  async deleteMedication(id, userId) {
    try {
      const medication = await this.getMedicationById(id, userId);
      await medication.destroy();
      return { message: 'Medication deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search medications by name for a specific user
   */
  async searchMedications(userId, searchTerm, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    try {
      const result = await this.Medication.findAndCountAll({
        where: {
          userId,
          name: {
            [Op.iLike]: `%${searchTerm}%`
          }
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']],
      });

      return {
        medications: result.rows,
        totalCount: result.count,
        totalPages: Math.ceil(result.count / limit),
        currentPage: parseInt(page),
        searchTerm
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get medications scheduled for a specific time range
   */
  async getMedicationsBySchedule(userId, startTime, endTime) {
    try {
      const medications = await this.Medication.findAll({
        where: { userId }
      });

      // Filter medications based on schedule times
      const filteredMedications = medications.filter(medication => {
        return medication.schedule.some(time => {
          return time >= startTime && time <= endTime;
        });
      });

      return filteredMedications;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate medication data
   */
  validateMedicationData(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }

    if (!data.dosage || typeof data.dosage !== 'string' || data.dosage.trim().length === 0) {
      errors.push('Dosage is required and must be a non-empty string');
    }

    if (!data.schedule || !Array.isArray(data.schedule) || data.schedule.length === 0) {
      errors.push('Schedule is required and must be a non-empty array');
    } else {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      data.schedule.forEach((time, index) => {
        if (typeof time !== 'string' || !timeRegex.test(time)) {
          errors.push(`Schedule time at index ${index} must be in HH:MM format`);
        }
      });
    }

    if (!data.userId || typeof data.userId !== 'string') {
      errors.push('UserId is required and must be a valid UUID string');
    }

    return errors;
  }
}

module.exports = MedicationService;