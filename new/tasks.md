# Implementation Plan: Book Reviews API

## Overview

Implement a RESTful Book Reviews API using Node.js and Express.js. The implementation proceeds incrementally: project setup and data layer first, then public read endpoints, then authentication, then protected review endpoints, with property-based and unit tests woven in throughout.

## Tasks

- [ ] 1. Initialize project structure and in-memory data store
  - Create `package.json` with dependencies: `express`, `express-session`, `jsonwebtoken`, `bcrypt`; dev dependencies: `jest`, `supertest`, `fast-check`
  - Create directory structure: `src/`, `tests/unit/`, `tests/property/`
  - Create `src/db.js` exporting a preloaded `books` object (keyed by ISBN, each with `isbn`, `title`, `author`, `reviews: {}`) and an empty `users` object
  - _Requirements: 1.1, 1.4, 2.1, 6.5_

- [ ] 2. Implement JWT middleware and Express application entry point
  - [ ] 2.1 Create `src/middleware/authenticateJWT.js` that validates `Authorization: Bearer <token>` headers, attaches `req.user` on success, and returns HTTP 401 on missing or invalid tokens
    - _Requirements: 8.3, 9.3, 10.3_
  - [ ]* 2.2 Write property test for JWT middleware (Property 10)
    - **Property 10: Protected endpoints reject unauthenticated requests**
    - **Validates: Requirements 8.3, 9.3, 10.3**
  - [ ] 2.3 Create `src/app.js` configuring `express.json()`, `express-session`, and mounting routers at `/`, `/customer`, and `/customer/auth`; export the app without starting the server
    - _Requirements: 11.1_
  - [ ] 2.4 Create `src/index.js` that imports `app.js` and starts the HTTP server on a configurable port
    - _Requirements: 11.1_

- [ ] 3. Implement public catalog endpoints
  - [ ] 3.1 Create `src/routes/public.js` with `GET /books` returning all books as a JSON array (HTTP 200)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]* 3.2 Write property test for catalog retrieval (Property 1)
    - **Property 1: Book catalog retrieval returns all books with required fields**
    - **Validates: Requirements 1.2, 1.4**
  - [ ] 3.3 Add `GET /books/isbn/:isbn` to the public router returning the matching book (HTTP 200) or HTTP 404 if not found
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 3.4 Write property tests for ISBN lookup (Properties 2 and 3)
    - **Property 2: ISBN lookup is a round-trip**
    - **Property 3: ISBN lookup returns 404 for absent ISBNs**
    - **Validates: Requirements 2.2, 2.3**
  - [ ] 3.5 Add `GET /books/author/:author` to the public router performing case-insensitive author matching, returning HTTP 200 with matches or HTTP 404 if none found
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 3.6 Write property test for author search (Property 4)
    - **Property 4: Author search is case-insensitive and returns all matches**
    - **Validates: Requirements 3.2, 3.3**
  - [ ] 3.7 Add `GET /books/title/:title` to the public router performing case-insensitive title matching, returning HTTP 200 with matches or HTTP 404 if none found
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 3.8 Write property test for title search (Property 5)
    - **Property 5: Title search is case-insensitive and returns all matches**
    - **Validates: Requirements 4.2, 4.3**
  - [ ] 3.9 Add `GET /books/review/:isbn` to the public router returning the reviews object for a book (HTTP 200, empty object if no reviews) or HTTP 404 if the book does not exist
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 3.10 Write property test for review retrieval round-trip (Property 6)
    - **Property 6: Review retrieval round-trip**
    - **Validates: Requirements 5.2**
  - [ ]* 3.11 Write unit tests for public catalog endpoints
    - Test `GET /books` with non-empty and empty catalog
    - Test `GET /books/isbn/:isbn` with existing and non-existing ISBNs
    - Test `GET /books/author/:author` and `GET /books/title/:title` with matching and non-matching values
    - Test `GET /books/review/:isbn` with reviews present, no reviews, and unknown ISBN
    - _Requirements: 1.2, 1.3, 2.2, 2.3, 3.2, 3.4, 4.2, 4.4, 5.2, 5.3, 5.4_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement user registration and login
  - [ ] 5.1 Create `src/routes/public.js` addition: `POST /register` that validates `username` and `password` fields (HTTP 400 if missing), rejects duplicate usernames (HTTP 409), hashes the password with `bcrypt`, stores the user, and returns HTTP 201
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ]* 5.2 Write property tests for registration (Properties 8 and 9)
    - **Property 8: Duplicate registration is rejected**
    - **Property 9: Passwords are never stored as plaintext**
    - **Validates: Requirements 6.3, 6.5**
  - [ ] 5.3 Create `src/routes/customer.js` with `POST /customer/login` that validates fields (HTTP 400 if missing), verifies credentials with `bcrypt.compare` (HTTP 401 on mismatch), establishes a session, signs a JWT, and returns HTTP 200 with `{ token }`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ]* 5.4 Write property test for registration-then-login round-trip (Property 7)
    - **Property 7: Registration then login round-trip**
    - **Validates: Requirements 6.2, 7.2**
  - [ ]* 5.5 Write unit tests for registration and login
    - Test successful registration and duplicate rejection
    - Test missing fields for both endpoints
    - Test login with valid credentials, wrong password, and unknown username
    - _Requirements: 6.2, 6.3, 6.4, 7.2, 7.3, 7.4, 7.5_

- [ ] 6. Implement authenticated review endpoints
  - [ ] 6.1 Create `src/routes/authenticated.js` with `PUT /customer/auth/review/:isbn` protected by `authenticateJWT`; validate review text (HTTP 400 if missing), validate ISBN exists (HTTP 404 if not), upsert the review under `req.user.username`, and return HTTP 200
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2_
  - [ ]* 6.2 Write property tests for review upsert (Properties 11 and 12)
    - **Property 11: Review upsert — only the latest review is stored per user per book**
    - **Property 12: Review ownership isolation**
    - **Validates: Requirements 8.6, 9.2, 9.4**
  - [ ] 6.3 Add `DELETE /customer/auth/review/:isbn` to the authenticated router protected by `authenticateJWT`; validate ISBN exists (HTTP 404 if not), validate the user has a review (HTTP 404 if not), delete only the requesting user's review, and return HTTP 200
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ]* 6.4 Write property test for add-then-delete round-trip (Property 13)
    - **Property 13: Review add-then-delete round-trip**
    - **Validates: Requirements 10.2**
  - [ ]* 6.5 Write unit tests for authenticated review endpoints
    - Test upsert creates a new review and replaces an existing one
    - Test delete removes the correct user's review and returns 404 when no review exists
    - Test that both endpoints return 401 without a valid JWT
    - Test that a user cannot delete another user's review
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 9.2, 9.4, 10.2, 10.3, 10.4, 10.5_

- [ ] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Add async error handling and wire everything together
  - [ ] 8.1 Wrap all route handlers in `try/catch` blocks that return HTTP 500 on unexpected errors; add a global Express error handler in `app.js`
    - _Requirements: 11.3_
  - [ ]* 8.2 Write property test for async error handling (Property 14)
    - **Property 14: Async error handling does not crash the server**
    - **Validates: Requirements 11.3**
  - [ ] 8.3 Mount all routers in `app.js` (`publicRouter` at `/`, `customerRouter` at `/customer`, `authenticatedRouter` at `/customer/auth` with `authenticateJWT` applied) and verify all routes are reachable
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1_
  - [ ]* 8.4 Write integration tests for concurrent request handling
    - Send multiple simultaneous requests and verify all complete with correct responses
    - _Requirements: 11.2_

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at meaningful milestones
- Property tests use **fast-check** and should run a minimum of 100 iterations each
- Unit tests use **Jest** with **supertest** for HTTP-level assertions
- The `books` data store is shared state — reset it between tests to avoid cross-test contamination
