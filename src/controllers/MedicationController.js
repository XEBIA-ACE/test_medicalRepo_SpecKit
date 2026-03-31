/**
 * Medication Controller
 * Handles HTTP requests and responses for medication operations
 */

const MedicationService = require('../services/MedicationService');
const database = require('../config/database');

class MedicationController {
  constructor() {
    this.medicationService = new MedicationService(database.getModel('Medication'));
  }

  /**
   * Create a new medication
   * POST /api/medications
   */
  async createMedication(req, res, next) {
    try {
      const userId = req.user.id; // From auth middleware
      const medicationData = { ...req.body, userId };

      // Validate input data
      const validationErrors = this.medicationService.validateMedicationData(medicationData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        });
      }

      const medication = await this.medicationService.createMedication(medicationData);
      
      res.status(201).json({
        success: true,
        data: medication,
        message: 'Medication created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all medications for the authenticated user
   * GET /api/medications
   */
  async getMedications(req, res, next) {
    try {
      const userId = req.user.id;
      const { page, limit, sortBy, sortOrder } = req.query;
      
      const options = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'DESC'
      };

      const result = await this.medicationService.getMedicationsByUserId(userId, options);
      
      res.status(200).json({
        success: true,
        data: result.medications,
        pagination: {
          totalCount: result.totalCount,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPreviousPage
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific medication by ID
   * GET /api/medications/:id
   */
  async getMedicationById(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const medication = await this.medicationService.getMedicationById(id, userId);
      
      res.status(200).json({
        success: true,
        data: medication
      });
    } catch (error) {
      if (error.message === 'Medication not found') {
        return res.status(404).json({
          error: 'Medication not found',
          message: 'The requested medication does not exist or you do not have access to it'
        });
      }
      next(error);
    }
  }

  /**
   * Update a medication
   * PUT /api/medications/:id
   */
  async updateMedication(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updateData = req.body;

      // Remove userId from update data to prevent tampering
      delete updateData.userId;

      // Validate update data if provided
      if (Object.keys(updateData).length > 0) {
        const tempData = { ...updateData, userId }; // Add userId for validation
        const validationErrors = this.medicationService.validateMedicationData(tempData);
        if (validationErrors.length > 0) {
          return res.status(400).json({
            error: 'Validation failed',
            details: validationErrors
          });
        }
      }

      const medication = await this.medicationService.updateMedication(id, userId, updateData);
      
      res.status(200).json({
        success: true,
        data: medication,
        message: 'Medication updated successfully'
      });
    } catch (error) {
      if (error.message === 'Medication not found') {
        return res.status(404).json({
          error: 'Medication not found',
          message: 'The requested medication does not exist or you do not have access to it'
        });
      }
      next(error);
    }
  }

  /**
   * Delete a medication
   * DELETE /api/medications/:id
   */
  async deleteMedication(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await this.medicationService.deleteMedication(id, userId);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      if (error.message === 'Medication not found') {
        return res.status(404).json({
          error: 'Medication not found',
          message: 'The requested medication does not exist or you do not have access to it'
        });
      }
      next(error);
    }
  }

  /**
   * Search medications by name
   * GET /api/medications/search?q=searchTerm
   */
  async searchMedications(req, res, next) {
    try {
      const userId = req.user.id;
      const { q: searchTerm, page, limit } = req.query;

      if (!searchTerm || searchTerm.trim().length === 0) {
        return res.status(400).json({
          error: 'Search term is required',
          message: 'Please provide a search term using the "q" query parameter'
        });
      }

      const options = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10
      };

      const result = await this.medicationService.searchMedications(userId, searchTerm.trim(), options);
      
      res.status(200).json({
        success: true,
        data: result.medications,
        pagination: {
          totalCount: result.totalCount,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          searchTerm: result.searchTerm
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get medications by schedule time range
   * GET /api/medications/schedule?start=08:00&end=12:00
   */
  async getMedicationsBySchedule(req, res, next) {
    try {
      const userId = req.user.id;
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({
          error: 'Time range required',
          message: 'Please provide both start and end time parameters in HH:MM format'
        });
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(start) || !timeRegex.test(end)) {
        return res.status(400).json({
          error: 'Invalid time format',
          message: 'Time parameters must be in HH:MM format'
        });
      }

      const medications = await this.medicationService.getMedicationsBySchedule(userId, start, end);
      
      res.status(200).json({
        success: true,
        data: medications,
        timeRange: { start, end }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MedicationController();