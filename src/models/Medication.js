/**
 * Medication Data Model
 * Defines the structure and validation for medication records
 */

const { DataTypes } = require('sequelize');

const MedicationModel = (sequelize) => {
  const Medication = sequelize.define('Medication', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    dosage: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    schedule: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidSchedule(value) {
          if (!Array.isArray(value)) {
            throw new Error('Schedule must be an array');
          }
          if (value.length === 0) {
            throw new Error('Schedule cannot be empty');
          }
          // Validate time format (HH:MM)
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          for (const time of value) {
            if (typeof time !== 'string' || !timeRegex.test(time)) {
              throw new Error('Schedule times must be in HH:MM format');
            }
          }
        }
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: 4
      }
    }
  }, {
    tableName: 'medications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['name', 'userId'],
        unique: false
      }
    ]
  });

  return Medication;
};

module.exports = MedicationModel;