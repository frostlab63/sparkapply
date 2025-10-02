# Workday API Integration Notes

## Authentication

Workday REST APIs use OAuth 2.0 for authentication. This requires registering an API client in Workday, granting it the necessary scopes, and then obtaining access and refresh tokens.

## API Endpoints

### Recruitment

*   `GET /jobPostings/{ID}`: Retrieves information about a specific job posting.
*   `GET /prospects/{ID}/educations`: Retrieves the educational background of a prospect (candidate).
*   `POST /prospects/{ID}/experiences`: Adds work experience to a prospect's profile.
*   `GET /prospects/{ID}/resumeAttachments`: Retrieves the resume of a prospect.
*   `GET /prospects/{ID}/skills`: Retrieves the skills of a prospect.

