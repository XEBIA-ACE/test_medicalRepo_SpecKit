/**
 * Medication Routes
 * Defines API endpoints for medication operations
 */

const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/MedicationController');
const { validateRequest } = require('../middleware/validation');

// Validation schemas
const createMedicationSchema = {
  name: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 255
  },
  dosage: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 100
  },
  schedule: {
    type: 'array',
    required: true,
    minItems: 1,
    items: {
      type: 'string',
      pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
    }
  }
};

const updateMedicationSchema = {
  name: {
    type: 'string',
    required: false,
    minLength: 1,
    maxLength: 255
  },
  dosage: {
    type: 'string',
    required: false,
    minLength: 1,
    maxLength: 100
  },
  schedule: {
    type: 'array',
    required: false,
    minItems: 1,
    items: {
      type: 'string',
      pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
    }
  }
};

// Routes

/**
 * @route   GET /api/medications/search
 * @desc    Search medications by name
 * @access  Private
 * @query   q (required) - search term
 * @query   page (optional) - page number
 * @query   limit (optional) - items per page
 */
router.get('/search', medicationController.searchMedications.bind(medicationController));

/**
 * @route   GET /api/medications/schedule
 * @desc    Get medications by schedule time range
 * @access  Private
 * @query   start (required) - start time in HH:MM format
 * @query   end (required) - end time in HH:MM format
 */
router.get('/schedule', medicationController.getMedicationsBySchedule.bind(medicationController));

/**
 * @route   GET /api/medications
 * @desc    Get all medications for authenticated user
 * @access  Private
 * @query   page (optional) - page number
 * @query   limit (optional) - items per page
 * @query   sortBy (optional) - field to sort by
 * @query   sortOrder (optional) - ASC or DESC
 */
router.get('/', medicationController.getMedications.bind(medicationController));

/**
 * @route   POST /api/medications
 * @desc    Create a new medication
 * @access  Private
 * @body    { name, dosage, schedule }
 */
router.post('/', 
  validateRequest(createMedicationSchema),
  medicationController.createMedication.bind(medicationController)
);

/**
 * @route   GET /api/medications/:id
 * @desc    Get a specific medication by ID
 * @access  Private
 * @param   id - medication UUID
 */
router.get('/:id', medicationController.getMedicationById.bind(medicationController));

/**
 * @route   PUT /api/medications/:id
 * @desc    Update a medication
 * @access  Private
 * @param   id - medication UUID
 * @body    { name?, dosage?, schedule? }
 */
router.put('/:id',
  validateRequest(updateMedicationSchema),
  medicationController.updateMedication.bind(medicationController)
);

/**
 * @route   DELETE /api/medications/:id
 * @desc    Delete a medication
 * @access  Private
 * @param   id - medication UUID
 */
router.delete('/:id', medicationController.deleteMedication.bind(medicationController));

module.exports = router;