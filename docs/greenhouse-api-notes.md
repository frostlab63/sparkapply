# Greenhouse API Integration Notes

## Authentication

Greenhouse Harvest API uses Basic Authentication over HTTPS. The username is the API token, and the password should be blank.

## API Endpoints

### Candidates

*   `GET /candidates`: Retrieves a list of candidates.
*   `GET /candidates/{id}`: Retrieves a single candidate.
*   `POST /candidates`: Creates a new candidate.

### Jobs

*   `GET /jobs`: Retrieves a list of jobs.
*   `GET /jobs/{id}`: Retrieves a single job.

### Applications

*   `GET /applications`: Retrieves a list of applications.
*   `GET /applications/{id}`: Retrieves a single application.

