# Advanced Job Application Management System

This document provides an overview of the new architecture for the Advanced Job Application Management System, instructions on how to run the tests, and a summary of the API endpoints.

## Architecture

The new architecture follows a test-driven development (TDD) approach and is organized into the following layers:

*   **Models:** Define the database schema using Sequelize.
*   **Services:** Contain the business logic for each entity (applications, interviews, documents).
*   **Controllers:** Handle API requests and responses, calling the appropriate services.
*   **Routes:** Define the API endpoints and map them to the controllers.
*   **Tests:** Include unit tests for the services and integration tests for the API.

This layered architecture promotes separation of concerns, making the application more modular, maintainable, and testable.

## Running the Tests

To run the tests, use the following commands from the `packages/api/application-service` directory:

*   **Run all tests:**

    ```bash
    npm test
    ```

*   **Run integration tests only:**

    ```bash
    npm run test:integration
    ```

## API Documentation

### Application API

*   `GET /applications`: Get all applications for the authenticated user.
*   `POST /applications`: Create a new application.
*   `PUT /applications/:id`: Update an existing application.
*   `GET /applications/analytics`: Get application analytics.
*   `POST /applications/bulk`: Perform bulk operations on applications (update status, archive, delete).
*   `GET /applications/dashboard`: Get application dashboard data.

### Interview API

*   `POST /interviews`: Schedule a new interview.
*   `GET /interviews/upcoming`: Get upcoming interviews.
*   `GET /interviews/calendar`: Get interviews for a given date range.

### Document API

*   `POST /documents`: Upload a new document.
*   `GET /documents/search`: Search for documents.
*   `GET /documents/organization`: Get document organization data.
*   `GET /documents/analytics`: Get document analytics.
*   `GET /documents/dashboard`: Get document dashboard data.

