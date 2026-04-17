# Requirements Document

## Introduction

This document defines the requirements for a RESTful book reviews API built with Node.js and Express.js. The application serves as the back-end for an online book retailer, enabling users to browse a preloaded catalog of books, search by various criteria, and manage book reviews. Authenticated users can add, modify, and delete their own reviews. The server supports concurrent access by multiple users via async request handling and protects write operations using session-based and JWT authentication.

## Glossary

- **API**: The RESTful web service implemented in Node.js and Express.js that handles all client requests.
- **Book**: A catalog entry preloaded into the application, containing at minimum an ISBN, title, and author.
- **ISBN**: International Standard Book Number — a unique identifier for each book in the catalog.
- **Review**: A text comment submitted by a registered user for a specific book.
- **User**: A person who interacts with the API via a front-end client or tools such as cURL or Postman.
- **Registered_User**: A user who has completed registration and holds a valid account in the system.
- **Authenticated_User**: A Registered_User who has successfully logged in and holds a valid session or JWT token.
- **Session**: A server-side session established upon login, used to authenticate subsequent requests.
- **JWT**: JSON Web Token — a signed token issued upon login, used to authenticate protected route requests.
- **Catalog**: The preloaded, in-memory or persistent collection of Book entries available in the application.

---

## Requirements

### Requirement 1: Retrieve All Books

**User Story:** As a user, I want to retrieve a list of all books available in the bookshop, so that I can browse the full catalog.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /books` endpoint that returns all books in the Catalog.
2. WHEN the Catalog contains one or more books, THE API SHALL return a response with HTTP status 200 and a JSON array of all Book entries.
3. WHEN the Catalog is empty, THE API SHALL return a response with HTTP status 200 and an empty JSON array.
4. THE API SHALL include at minimum the ISBN, title, and author fields for each Book in the response.

---

### Requirement 2: Search Books by ISBN

**User Story:** As a user, I want to search for a book by its ISBN, so that I can quickly locate a specific title.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /books/isbn/:isbn` endpoint that accepts an ISBN path parameter.
2. WHEN a Book with the provided ISBN exists in the Catalog, THE API SHALL return a response with HTTP status 200 and the matching Book entry as a JSON object.
3. IF no Book with the provided ISBN exists in the Catalog, THEN THE API SHALL return a response with HTTP status 404 and a JSON error message.

---

### Requirement 3: Search Books by Author

**User Story:** As a user, I want to search for books by author name, so that I can find all titles written by a specific author.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /books/author/:author` endpoint that accepts an author name path parameter.
2. WHEN one or more Books with a matching author exist in the Catalog, THE API SHALL return a response with HTTP status 200 and a JSON array of all matching Book entries.
3. WHEN the author name match is evaluated, THE API SHALL perform a case-insensitive comparison against the author field of each Book.
4. IF no Books with a matching author exist in the Catalog, THEN THE API SHALL return a response with HTTP status 404 and a JSON error message.

---

### Requirement 4: Search Books by Title

**User Story:** As a user, I want to search for books by title, so that I can find a book when I know part or all of its name.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /books/title/:title` endpoint that accepts a title path parameter.
2. WHEN one or more Books with a matching title exist in the Catalog, THE API SHALL return a response with HTTP status 200 and a JSON array of all matching Book entries.
3. WHEN the title match is evaluated, THE API SHALL perform a case-insensitive comparison against the title field of each Book.
4. IF no Books with a matching title exist in the Catalog, THEN THE API SHALL return a response with HTTP status 404 and a JSON error message.

---

### Requirement 5: Retrieve Book Reviews

**User Story:** As a user, I want to retrieve all reviews for a specific book, so that I can read what others have said about it.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /books/review/:isbn` endpoint that accepts an ISBN path parameter.
2. WHEN one or more Reviews exist for the specified Book, THE API SHALL return a response with HTTP status 200 and a JSON object containing all Reviews for that Book, keyed by username.
3. WHEN no Reviews exist for the specified Book, THE API SHALL return a response with HTTP status 200 and an empty JSON object.
4. IF no Book with the provided ISBN exists in the Catalog, THEN THE API SHALL return a response with HTTP status 404 and a JSON error message.

---

### Requirement 6: User Registration

**User Story:** As a new user, I want to register an account, so that I can log in and manage book reviews.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /register` endpoint that accepts a JSON request body containing a username and password.
2. WHEN a registration request is received with a username that does not already exist, THE API SHALL create a new Registered_User account and return a response with HTTP status 201 and a JSON success message.
3. IF a registration request is received with a username that already exists, THEN THE API SHALL return a response with HTTP status 409 and a JSON error message indicating the username is taken.
4. IF a registration request is received without a username or without a password, THEN THE API SHALL return a response with HTTP status 400 and a JSON error message indicating the missing field.
5. THE API SHALL store the password in a hashed form and SHALL NOT store plaintext passwords.

---

### Requirement 7: User Login

**User Story:** As a registered user, I want to log in to the application, so that I can access protected review management features.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /customer/login` endpoint that accepts a JSON request body containing a username and password.
2. WHEN a login request is received with a valid username and matching password, THE API SHALL establish a Session for the user, issue a signed JWT, and return a response with HTTP status 200 and a JSON object containing the JWT.
3. IF a login request is received with a username that does not exist, THEN THE API SHALL return a response with HTTP status 401 and a JSON error message.
4. IF a login request is received with an incorrect password, THEN THE API SHALL return a response with HTTP status 401 and a JSON error message.
5. IF a login request is received without a username or without a password, THEN THE API SHALL return a response with HTTP status 400 and a JSON error message indicating the missing field.

---

### Requirement 8: Add a Book Review

**User Story:** As an authenticated user, I want to add a review for a book, so that I can share my opinion with other readers.

#### Acceptance Criteria

1. THE API SHALL expose a `PUT /customer/auth/review/:isbn` endpoint that accepts an ISBN path parameter and a JSON request body containing the review text.
2. WHILE a user is Authenticated, WHEN a review submission request is received for a Book that exists in the Catalog, THE API SHALL store the Review under the Authenticated_User's username and return a response with HTTP status 200 and a JSON success message.
3. IF a review submission request is received without a valid Session or JWT, THEN THE API SHALL return a response with HTTP status 401 and a JSON error message.
4. IF a review submission request is received for an ISBN that does not exist in the Catalog, THEN THE API SHALL return a response with HTTP status 404 and a JSON error message.
5. IF a review submission request is received without review text, THEN THE API SHALL return a response with HTTP status 400 and a JSON error message.
6. WHEN an Authenticated_User submits a review for a Book for which the Authenticated_User has already submitted a review, THE API SHALL replace the existing Review with the new review text.

---

### Requirement 9: Modify a Book Review

**User Story:** As an authenticated user, I want to modify my existing review for a book, so that I can update my opinion after re-reading.

#### Acceptance Criteria

1. THE API SHALL expose a `PUT /customer/auth/review/:isbn` endpoint (shared with the add review operation) that updates an existing Review when one already exists for the Authenticated_User and the specified ISBN.
2. WHILE a user is Authenticated, WHEN a modification request is received for a Review that belongs to the Authenticated_User, THE API SHALL update the stored Review with the new review text and return a response with HTTP status 200 and a JSON success message.
3. IF a modification request is received without a valid Session or JWT, THEN THE API SHALL return a response with HTTP status 401 and a JSON error message.
4. THE API SHALL allow an Authenticated_User to modify only Reviews that were submitted under the Authenticated_User's own username and SHALL NOT allow modification of Reviews submitted by other users.

---

### Requirement 10: Delete a Book Review

**User Story:** As an authenticated user, I want to delete my review for a book, so that I can remove feedback I no longer stand behind.

#### Acceptance Criteria

1. THE API SHALL expose a `DELETE /customer/auth/review/:isbn` endpoint that accepts an ISBN path parameter.
2. WHILE a user is Authenticated, WHEN a deletion request is received for a Review that belongs to the Authenticated_User for the specified Book, THE API SHALL remove the Review and return a response with HTTP status 200 and a JSON success message.
3. IF a deletion request is received without a valid Session or JWT, THEN THE API SHALL return a response with HTTP status 401 and a JSON error message.
4. IF a deletion request is received for an ISBN for which the Authenticated_User has no Review, THEN THE API SHALL return a response with HTTP status 404 and a JSON error message.
5. THE API SHALL allow an Authenticated_User to delete only Reviews that were submitted under the Authenticated_User's own username and SHALL NOT allow deletion of Reviews submitted by other users.

---

### Requirement 11: Concurrent User Access

**User Story:** As a system operator, I want the application to handle multiple simultaneous users, so that the service remains responsive under concurrent load.

#### Acceptance Criteria

1. THE API SHALL implement all route handlers using async/await, Promises, or callbacks to ensure non-blocking I/O processing.
2. WHEN multiple requests are received simultaneously, THE API SHALL process each request independently without blocking other in-flight requests.
3. WHEN an async operation fails, THE API SHALL catch the error and return an appropriate HTTP error response rather than crashing the server process.
