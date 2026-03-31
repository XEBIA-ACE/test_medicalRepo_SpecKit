/**
 * Request Validation Middleware
 * Validates incoming request data against defined schemas
 */

/**
 * Validate request body against a schema
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const data = req.body;

    // Check each field in the schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Check if required field is missing
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`Field '${field}' is required`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (rules.type) {
        if (!validateType(value, rules.type)) {
          errors.push(`Field '${field}' must be of type ${rules.type}`);
          continue;
        }
      }

      // String validations
      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`Field '${field}' must be at least ${rules.minLength} characters long`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`Field '${field}' must be no more than ${rules.maxLength} characters long`);
        }
        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
          errors.push(`Field '${field}' format is invalid`);
        }
      }

      // Array validations
      if (rules.type === 'array' && Array.isArray(value)) {
        if (rules.minItems && value.length < rules.minItems) {
          errors.push(`Field '${field}' must have at least ${rules.minItems} items`);
        }
        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push(`Field '${field}' must have no more than ${rules.maxItems} items`);
        }

        // Validate array items
        if (rules.items) {
          value.forEach((item, index) => {
            if (rules.items.type && !validateType(item, rules.items.type)) {
              errors.push(`Item at index ${index} in field '${field}' must be of type ${rules.items.type}`);
            }
            if (rules.items.pattern && typeof item === 'string' && !new RegExp(rules.items.pattern).test(item)) {
              errors.push(`Item at index ${index} in field '${field}' format is invalid`);
            }
          });
        }
      }

      // Number validations
      if (rules.type === 'number' && typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`Field '${field}' must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`Field '${field}' must be no more than ${rules.max}`);
        }
      }

      // Custom validation function
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value);
        if (customError) {
          errors.push(`Field '${field}': ${customError}`);
        }
      }
    }

    // Check for unexpected fields
    const allowedFields = Object.keys(schema);
    const providedFields = Object.keys(data);
    const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (unexpectedFields.length > 0) {
      errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};

/**
 * Validate query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const query = req.query;

    for (const [field, rules] of Object.entries(schema)) {
      const value = query[field];

      if (rules.required && !value) {
        errors.push(`Query parameter '${field}' is required`);
        continue;
      }

      if (value && rules.type) {
        let convertedValue = value;

        // Convert string values to appropriate types
        if (rules.type === 'number') {
          convertedValue = Number(value);
          if (isNaN(convertedValue)) {
            errors.push(`Query parameter '${field}' must be a valid number`);
            continue;
          }
        } else if (rules.type === 'boolean') {
          convertedValue = value.toLowerCase() === 'true';
        }

        // Update query with converted value
        req.query[field] = convertedValue;

        // Additional validations
        if (rules.min !== undefined && convertedValue < rules.min) {
          errors.push(`Query parameter '${field}' must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && convertedValue > rules.max) {
          errors.push(`Query parameter '${field}' must be no more than ${rules.max}`);
        }
        if (rules.enum && !rules.enum.includes(convertedValue)) {
          errors.push(`Query parameter '${field}' must be one of: ${rules.enum.join(', ')}`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Query validation failed',
        details: errors
      });
    }

    next();
  };
};

/**
 * Validate URL parameters
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const params = req.params;

    for (const [field, rules] of Object.entries(schema)) {
      const value = params[field];

      if (rules.required && !value) {
        errors.push(`URL parameter '${field}' is required`);
        continue;
      }

      if (value && rules.pattern && !new RegExp(rules.pattern).test(value)) {
        errors.push(`URL parameter '${field}' format is invalid`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Parameter validation failed',
        details: errors
      });
    }

    next();
  };
};

/**
 * Helper function to validate data types
 */
const validateType = (value, expectedType) => {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return true;
  }
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams
};