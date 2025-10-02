# BambooHR API Integration Notes

## Authentication

BambooHR uses HTTP Basic Authentication with an API key. The API key is used as the username, and any random string can be used as the password.

## API Endpoints

### Applicant Tracking

*   `GET /jobs/summary`: Retrieves a summary of all jobs.
*   `GET /jobs/{jobId}/applications`: Retrieves all applications for a specific job.
*   `POST /jobs/{jobId}/applications`: Adds a new candidate application to a job opening.

