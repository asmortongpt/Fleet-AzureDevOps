markdown
# Sentry Test Guide

## Introduction
This guide provides instructions for testing Sentry integration in the backend.

## Configuration
1. Ensure the Sentry DSN is set in the `.env` file.
2. Verify that the Sentry client is initialized in the application.

## Testing Scenarios
- **Simulate a ValidationError:**
  - Trigger a validation error in an API endpoint.
  - Verify that the error is logged in Sentry.

- **Simulate an UnauthorizedError:**
  - Access a protected endpoint without authentication.
  - Confirm the error is captured by Sentry.

## Troubleshooting
- Ensure network connectivity to Sentry.
- Check Sentry dashboard for error logs.