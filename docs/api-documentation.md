# SparkApply API Documentation

## Overview

The SparkApply API provides a comprehensive set of endpoints for managing user authentication, job discovery, application tracking, and AI-powered features. This RESTful API follows OpenAPI 3.0 specifications and supports JSON request/response formats.

**Base URL**: `https://api.sparkapply.com/v1`  
**Staging URL**: `https://staging-api.sparkapply.com/v1`  
**Development URL**: `http://localhost:3001/api/v1`

## Authentication

SparkApply uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Lifecycle
- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- **Auto-refresh**: Tokens are automatically refreshed when expired

## API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "job_seeker"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "job_seeker",
      "isVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token"
    }
  }
}
```

#### POST /auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "job_seeker"
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token"
    }
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

#### POST /auth/logout
Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer <access-token>`

### User Management Endpoints

#### GET /users/profile
Get current user profile.

**Headers:** `Authorization: Bearer <access-token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "job_seeker",
    "profile": {
      "bio": "Software developer with 5 years experience",
      "location": "San Francisco, CA",
      "skills": ["JavaScript", "React", "Node.js"],
      "experience": "5-7 years",
      "education": "Bachelor's in Computer Science"
    },
    "preferences": {
      "jobTypes": ["full-time", "remote"],
      "salaryRange": {
        "min": 80000,
        "max": 120000
      }
    }
  }
}
```

#### PUT /users/profile
Update user profile.

**Headers:** `Authorization: Bearer <access-token>`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "profile": {
    "bio": "Updated bio",
    "location": "New York, NY",
    "skills": ["JavaScript", "React", "Node.js", "Python"]
  }
}
```

### Job Discovery Endpoints

#### GET /jobs
Get paginated list of jobs.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `location` (string): Filter by location
- `type` (string): Filter by job type (full-time, part-time, contract, remote)
- `salary_min` (integer): Minimum salary filter
- `salary_max` (integer): Maximum salary filter

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job-uuid",
        "title": "Senior Frontend Developer",
        "company": "TechCorp Inc.",
        "location": "San Francisco, CA",
        "type": "full-time",
        "salary": {
          "min": 100000,
          "max": 140000,
          "currency": "USD"
        },
        "description": "We are looking for a senior frontend developer...",
        "requirements": ["5+ years React experience", "TypeScript"],
        "benefits": ["Health insurance", "401k", "Remote work"],
        "postedAt": "2024-01-01T00:00:00.000Z",
        "expiresAt": "2024-02-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### GET /jobs/search
Search jobs with advanced filters.

**Query Parameters:**
- `q` (string): Search query
- `location` (string): Location filter
- `skills` (array): Required skills
- `experience` (string): Experience level
- `sort` (string): Sort by (relevance, date, salary)

#### GET /jobs/:id
Get detailed job information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "job-uuid",
    "title": "Senior Frontend Developer",
    "company": {
      "name": "TechCorp Inc.",
      "logo": "https://example.com/logo.png",
      "website": "https://techcorp.com",
      "size": "100-500 employees",
      "industry": "Technology"
    },
    "location": "San Francisco, CA",
    "type": "full-time",
    "remote": true,
    "salary": {
      "min": 100000,
      "max": 140000,
      "currency": "USD"
    },
    "description": "Detailed job description...",
    "requirements": ["5+ years React experience", "TypeScript"],
    "responsibilities": ["Lead frontend development", "Mentor junior developers"],
    "benefits": ["Health insurance", "401k", "Remote work"],
    "applicationDeadline": "2024-02-01T00:00:00.000Z",
    "matchScore": 85
  }
}
```

### Application Management Endpoints

#### POST /applications
Submit job application.

**Headers:** `Authorization: Bearer <access-token>`

**Request Body:**
```json
{
  "jobId": "job-uuid",
  "coverLetter": "Dear hiring manager...",
  "resumeId": "resume-uuid",
  "customAnswers": {
    "question1": "Answer to custom question"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "application-uuid",
    "jobId": "job-uuid",
    "status": "submitted",
    "submittedAt": "2024-01-01T00:00:00.000Z",
    "aiGenerated": {
      "coverLetter": true,
      "resume": false
    }
  }
}
```

#### GET /applications
Get user's job applications.

**Headers:** `Authorization: Bearer <access-token>`

**Query Parameters:**
- `status` (string): Filter by status (submitted, reviewed, interview, rejected, accepted)
- `page` (integer): Page number
- `limit` (integer): Items per page

#### GET /applications/:id
Get detailed application information.

#### PUT /applications/:id
Update application (if allowed).

### AI-Powered Features

#### POST /ai/generate-cover-letter
Generate AI-powered cover letter.

**Headers:** `Authorization: Bearer <access-token>`

**Request Body:**
```json
{
  "jobId": "job-uuid",
  "tone": "professional",
  "highlights": ["leadership", "technical skills"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "coverLetter": "Generated cover letter content...",
    "wordCount": 250,
    "readabilityScore": 85,
    "suggestions": ["Consider adding specific achievements"]
  }
}
```

#### POST /ai/optimize-resume
Optimize resume for specific job.

**Request Body:**
```json
{
  "jobId": "job-uuid",
  "resumeId": "resume-uuid"
}
```

#### GET /ai/job-match-score/:jobId
Get AI-calculated job match score.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "matchScore": 85,
    "breakdown": {
      "skills": 90,
      "experience": 80,
      "location": 85,
      "salary": 90
    },
    "recommendations": [
      "Highlight your React experience",
      "Consider learning TypeScript"
    ]
  }
}
```

### File Upload Endpoints

#### POST /upload/resume
Upload resume file.

**Headers:** 
- `Authorization: Bearer <access-token>`
- `Content-Type: multipart/form-data`

**Request Body:** Form data with file

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "file-uuid",
    "filename": "resume.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "url": "https://cdn.sparkapply.com/resumes/file-uuid.pdf",
    "extractedText": "Resume content...",
    "skills": ["JavaScript", "React", "Node.js"]
  }
}
```

### Health and Monitoring

#### GET /health
System health check.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "ai_service": "healthy"
  }
}
```

#### GET /metrics
Prometheus metrics endpoint (monitoring only).

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes

- `400 BAD_REQUEST`: Invalid request data
- `401 UNAUTHORIZED`: Missing or invalid authentication
- `403 FORBIDDEN`: Insufficient permissions
- `404 NOT_FOUND`: Resource not found
- `409 CONFLICT`: Resource already exists
- `422 VALIDATION_ERROR`: Input validation failed
- `429 RATE_LIMITED`: Too many requests
- `500 INTERNAL_ERROR`: Server error

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 100 requests per minute
- **File upload endpoints**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

SparkApply supports webhooks for real-time notifications:

### Application Status Updates
```json
{
  "event": "application.status_changed",
  "data": {
    "applicationId": "uuid",
    "jobId": "uuid",
    "userId": "uuid",
    "oldStatus": "submitted",
    "newStatus": "interview",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Job Recommendations
```json
{
  "event": "job.recommended",
  "data": {
    "userId": "uuid",
    "jobId": "uuid",
    "matchScore": 85,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## SDK and Libraries

Official SDKs are available for:
- **JavaScript/Node.js**: `npm install @sparkapply/sdk`
- **Python**: `pip install sparkapply-sdk`
- **React**: `npm install @sparkapply/react-sdk`

## Support and Resources

- **API Status**: https://status.sparkapply.com
- **Developer Portal**: https://developers.sparkapply.com
- **Support**: support@sparkapply.com
- **Rate Limit Increases**: Contact support for higher limits

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- User authentication and management
- Job discovery and search
- Application tracking
- AI-powered features
- File upload support
