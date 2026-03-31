# Medication Repository Service API Documentation

## Overview

The Medication Repository Service provides a RESTful API for managing user medications, including creating, reading, updating, and deleting medication records. The service ensures HIPAA compliance and provides real-time synchronization with 99% accuracy.

**Service Information:**
- Service ID: DATA-01
- Service Name: Medication Repository Service
- Organization ID: 95bd4e80-e002-4fe5-ab71-fa85aad9fec8
- Project ID: c146ce5e-9e07-49d9-8d30-a184f2c17e32
- Base URL: `http://localhost:3000/api`
- Version: 1.0.0

## Authentication

All API endpoints require authentication using JWT (JSON Web Tokens). Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Errors

- `401 Unauthorized`: Missing, invalid, or expired token
- `403 Forbidden`: Insufficient permissions

## Data Models

### Medication

```json
{
  "id": "uuid",
  "name": "string (1-255 characters)",
  "dosage": "string (1-100 characters)",
  "schedule": ["HH:MM", "HH:MM", ...],
  "userId": "uuid",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Field Descriptions:**
- `id`: Unique identifier (UUID v4)
- `name`: Medication name (required)
- `dosage`: Dosage information (required)
- `schedule`: Array of time strings in HH:MM format (required, min 1 item)
- `userId`: User identifier (automatically set from authentication)
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

## API Endpoints

### Health Check

#### GET /health

Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "Medication Repository Service",
  "version": "1.0.0"
}
```

### Medications

#### GET /api/medications

Get all medications for the authenticated user with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sortBy` (optional): Field to sort by (default: createdAt)
- `sortOrder` (optional): ASC or DESC (default: DESC)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Aspirin",
      "dosage": "100mg",
      "schedule": ["08:00", "20:00"],
      "userId": "user-uuid",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "totalCount": 25,
    "totalPages": 3,
    "currentPage": 1,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

#### POST /api/medications

Create a new medication record.

**Request Body:**
```json
{
  "name": "Aspirin",
  "dosage": "100mg",
  "schedule": ["08:00", "20:00"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Aspirin",
    "dosage": "100mg",
    "schedule": ["08:00", "20:00"],
    "userId": "user-uuid",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Medication created successfully"
}
```

#### GET /api/medications/:id

Get a specific medication by ID.

**Parameters:**
- `id`: Medication UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Aspirin",
    "dosage": "100mg",
    "schedule": ["08:00", "20:00"],
    "userId": "user-uuid",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### PUT /api/medications/:id

Update a medication record.

**Parameters:**
- `id`: Medication UUID

**Request Body (all fields optional):**
```json
{
  "name": "Updated Aspirin",
  "dosage": "200mg",
  "schedule": ["09:00", "21:00"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Updated Aspirin",
    "dosage": "200mg",
    "schedule": ["09:00", "21:00"],
    "userId": "user-uuid",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T13:00:00.000Z"
  },
  "message": "Medication updated successfully"
}
```

#### DELETE /api/medications/:id

Delete a medication record.

**Parameters:**
- `id`: Medication UUID

**Response:**
```json
{
  "success": true,
  "message": "Medication deleted successfully"
}
```

### Search and Filtering

#### GET /api/medications/search

Search medications by name.

**Query Parameters:**
- `q` (required): Search term
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Aspirin",
      "dosage": "100mg",
      "schedule": ["08:00", "20:00"],
      "userId": "user-uuid",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "totalCount": 5,
    "totalPages": 1,
    "currentPage": 1,
    "searchTerm": "aspirin"
  }
}
```

#### GET /api/medications/schedule

Get medications scheduled within a time range.

**Query Parameters:**
- `start` (required): Start time in HH:MM format
- `end` (required): End time in HH:MM format

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Morning Vitamin",
      "dosage": "1 tablet",
      "schedule": ["08:00"],
      "userId": "user-uuid",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "timeRange": {
    "start": "08:00",
    "end": "12:00"
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/medications",
  "method": "POST",
  "details": ["Additional error details"]
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `422 Unprocessable Entity`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Validation Errors

Validation errors include detailed information about failed validations:

```json
{
  "error": "Validation failed",
  "details": [
    "Field 'name' is required",
    "Field 'schedule' must have at least 1 items",
    "Schedule time at index 0 must be in HH:MM format"
  ]
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Limit**: 100 requests per 15-minute window per IP address
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns `429 Too Many Requests` when limit is exceeded

## Performance

- **Target Response Time**: < 500ms for typical operations
- **Availability**: 99.9% uptime SLA
- **Data Accuracy**: 99% accuracy guarantee

## Security

- **HIPAA Compliance**: All data handling follows HIPAA regulations
- **Encryption**: Data encrypted in transit (HTTPS) and at rest
- **Authentication**: JWT-based authentication with configurable expiration
- **Authorization**: User-based access control (users can only access their own data)
- **Input Validation**: Comprehensive input validation and sanitization

## SDK and Examples

### cURL Examples

**Create a medication:**
```bash
curl -X POST http://localhost:3000/api/medications \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aspirin",
    "dosage": "100mg",
    "schedule": ["08:00", "20:00"]
  }'
```

**Get medications:**
```bash
curl -X GET "http://localhost:3000/api/medications?page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

**Search medications:**
```bash
curl -X GET "http://localhost:3000/api/medications/search?q=aspirin" \
  -H "Authorization: Bearer your-jwt-token"
```

### JavaScript Example

```javascript
const API_BASE = 'http://localhost:3000/api';
const token = 'your-jwt-token';

// Create medication
const createMedication = async (medicationData) => {
  const response = await fetch(`${API_BASE}/medications`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(medicationData)
  });
  return response.json();
};

// Get medications
const getMedications = async (page = 1, limit = 10) => {
  const response = await fetch(`${API_BASE}/medications?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## Support

For technical support or questions about the Medication Repository Service API:

- **Documentation**: This document
- **Health Check**: GET /health
- **API Info**: GET /api/docs

## Changelog

### Version 1.0.0
- Initial release
- Basic CRUD operations for medications
- Search and filtering capabilities
- JWT authentication
- HIPAA-compliant data handling
- Rate limiting and security features