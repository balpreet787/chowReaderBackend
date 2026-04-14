# chowReaderBackend

Starter backend structure for Chow Reader.

## Project structure

- `src/config` for environment and app configuration
- `src/controllers` for request handlers
- `src/middleware` for Express middleware
- `src/routes` for API route registration
- `src/services` for business logic
- `src/utils` for shared helpers

## Getting started

1. Install dependencies with `npm install`
2. Build the TypeScript output with `npm run build`
3. Start the server in development with `npm run dev`
4. Check the API at `http://127.0.0.1:5000/api/health`

## Firebase App Check

The `/user`, `/books`, and `/comment-threads` routes require a valid
`X-Firebase-AppCheck` header.

For local development:

1. Configure Firebase App Check in the Android app with the debug provider
2. Add the emitted debug token in the Firebase Console
3. Set `GOOGLE_APPLICATION_CREDENTIALS` to a Firebase Admin service account JSON
4. Optionally set `FIREBASE_PROJECT_ID` if your local credentials do not expose it

On Cloud Run, the backend can verify App Check tokens with the service's default
credentials as long as the Cloud Run project matches the Firebase project.
