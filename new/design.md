# Design Document: Book Reviews API

## Overview

The Book Reviews API is a RESTful web service built with Node.js and Express.js that serves as the back-end for an online book retailer. It provides public endpoints for browsing and searching a preloaded book catalog, user registration and JWT-based authentication, and authenticated endpoints for managing book reviews.

The API is stateless at the HTTP layer (JWT-based auth) while also supporting server-side sessions. All route handlers are implemented asynchronously to support concurrent access without blocking.

### Key Design Decisions

- **In-memory data store**: The catalog and user/review data are stored in-memory (JavaScript objects/Maps) for simplicity. This avoids database setup complexity while meeting the requirements.
- **Dual auth strategy**: Both session-based and JWT authentication are supported. Session middleware handles session state; JWT middleware validates tokens on protected routes.
- **Upsert semantics for reviews**: The `PUT /customer/auth/review/:isbn` endpoint acts as an upsert — it creates a new review or replaces an existing one for the same user/ISBN pair.
- **Case-insensitive search**: Author and title searches use case-insensitive string comparison to improve usability.
- **Password hashing**: `bcrypt` is used to hash passwords before storage, ensuring plaintext passwords are never persisted.

---

## Architecture

The application follows a layered Express.js architecture:

```
┌─────────────────────────────────────────────────────┐
│                    HTTP Client                       │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Express.js Application                  │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Middleware Stack                    │ │
│  │  express.json() │ express-session │ cors         │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │   Public Router  │  │  Authenticated Router    │  │
│  │  GET /books      │  │  (JWT middleware)        │  │
│  │  GET /books/...  │  │  PUT  /auth/review/:isbn │  │
│  │  POST /register  │  │  DELETE /auth/review/:isbn│  │
│  │  POST /login     │  └──────────────────────────┘  │
│  └──────────────────┘                                │
│  ┌─────────────────────────────────────────────────┐ │
│  │              In-Memory Data Store               │ │
│  │   books: { [isbn]: Book }                       │ │
│  │   users: { [username]: User }                   │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Request Flow

1. All requests pass through global middleware (JSON body parsing, session handling).
2. Public routes are handled directly by the public router.
3. Protected routes (`/customer/auth/*`) pass through JWT verification middleware before reaching route handlers.
4. Route handlers interact with the in-memory data store and return JSON responses.

---

## Components and Interfaces

### 1. Express Application (`app.js` / `index.js`)

Entry point. Configures middleware, mounts routers, and starts the HTTP server.

```javascript
// Middleware
app.use(express.json());
app.use(session({ secret, resave: false, saveUninitialized: true }));

// Routers
app.use('/', publicRouter);
app.use('/customer', customerRouter);  // contains /login
app.use('/customer/auth', authenticatedRouter);  // JWT-protected
```

### 2. Public Router

Handles unauthenticated endpoints:

| Method | Path | Handler |
|--------|------|---------|
| GET | `/books` | `getAllBooks` |
| GET | `/books/isbn/:isbn` | `getBookByISBN` |
| GET | `/books/author/:author` | `getBooksByAuthor` |
| GET | `/books/title/:title` | `getBooksByTitle` |
| GET | `/books/review/:isbn` | `getBookReviews` |
| POST | `/register` | `registerUser` |

### 3. Customer Router

Handles login (session establishment + JWT issuance):

| Method | Path | Handler |
|--------|------|---------|
| POST | `/customer/login` | `loginUser` |

### 4. Authenticated Router

Protected by JWT middleware. Handles review management:

| Method | Path | Handler |
|--------|------|---------|
| PUT | `/customer/auth/review/:isbn` | `upsertReview` |
| DELETE | `/customer/auth/review/:isbn` | `deleteReview` |

### 5. JWT Middleware (`authenticateJWT`)

Validates the `Authorization: Bearer <token>` header on protected routes. Extracts the username from the token payload and attaches it to `req.user`.

```javascript
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

### 6. In-Memory Data Store (`db.js`)

Exports shared mutable objects used across route handlers:

```javascript
// Preloaded book catalog
const books = {
  "9780743273565": { isbn: "9780743273565", title: "The Great Gatsby", author: "F. Scott Fitzgerald", reviews: {} },
  // ... more books
};

// User registry
const users = {};
// Shape: { [username]: { username: string, password: string /* hashed */ } }

module.exports = { books, users };
```

Reviews are stored inline within each book entry:
```javascript
books[isbn].reviews[username] = "review text";
```

---

## Data Models

### Book

```typescript
interface Book {
  isbn: string;       // Unique identifier (e.g., "9780743273565")
  title: string;      // Book title
  author: string;     // Author name
  reviews: {          // Reviews keyed by username
    [username: string]: string;
  };
}
```

### User

```typescript
interface User {
  username: string;   // Unique username
  password: string;   // bcrypt-hashed password (never plaintext)
}
```

### JWT Payload

```typescript
interface JWTPayload {
  username: string;
  iat: number;        // Issued at (Unix timestamp)
  exp: number;        // Expiration (Unix timestamp)
}
```

### API Response Shapes

**Success (book list):**
```json
[
  { "isbn": "9780743273565", "title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "reviews": {} }
]
```

**Success (reviews):**
```json
{
  "alice": "A masterpiece of American literature.",
  "bob": "Overrated but well-written."
}
```

**Error:**
```json
{ "message": "Book not found" }
```

**Login success:**
```json
{ "token": "<signed JWT>" }
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This feature is well-suited for property-based testing. The core logic involves data retrieval, search filtering, authentication, and review management — all pure or near-pure functions with clear input/output behavior and meaningful input variation.

Property-based testing library: **[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript/TypeScript PBT library).

---

### Property 1: Book catalog retrieval returns all books with required fields

*For any* non-empty catalog of books, calling `GET /books` SHALL return HTTP 200 and a JSON array where every entry contains at minimum the `isbn`, `title`, and `author` fields, and the array length equals the number of books in the catalog.

**Validates: Requirements 1.2, 1.4**

---

### Property 2: ISBN lookup is a round-trip

*For any* book in the catalog, calling `GET /books/isbn/:isbn` with that book's ISBN SHALL return HTTP 200 and a JSON object whose `isbn`, `title`, and `author` fields match the original book entry.

**Validates: Requirements 2.2**

---

### Property 3: ISBN lookup returns 404 for absent ISBNs

*For any* ISBN string that does not correspond to a book in the catalog, calling `GET /books/isbn/:isbn` SHALL return HTTP 404.

**Validates: Requirements 2.3**

---

### Property 4: Author search is case-insensitive and returns all matches

*For any* catalog and any author name present in that catalog, calling `GET /books/author/:author` with any casing variant of that author name (uppercase, lowercase, mixed) SHALL return HTTP 200 and a JSON array containing exactly all books whose author field matches case-insensitively, with no extra or missing entries.

**Validates: Requirements 3.2, 3.3**

---

### Property 5: Title search is case-insensitive and returns all matches

*For any* catalog and any title present in that catalog, calling `GET /books/title/:title` with any casing variant of that title SHALL return HTTP 200 and a JSON array containing exactly all books whose title field matches case-insensitively, with no extra or missing entries.

**Validates: Requirements 4.2, 4.3**

---

### Property 6: Review retrieval round-trip

*For any* set of reviews submitted by distinct users for a given book, calling `GET /books/review/:isbn` SHALL return HTTP 200 and a JSON object containing all submitted reviews keyed by the submitting user's username, with no reviews missing or added.

**Validates: Requirements 5.2**

---

### Property 7: Registration then login round-trip

*For any* valid username and password pair, successfully registering via `POST /register` (HTTP 201) SHALL result in the ability to log in via `POST /customer/login` with those same credentials and receive HTTP 200 with a JWT token in the response body.

**Validates: Requirements 6.2, 7.2**

---

### Property 8: Duplicate registration is rejected

*For any* username that has already been registered, a second `POST /register` request with the same username SHALL return HTTP 409 regardless of the password provided.

**Validates: Requirements 6.3**

---

### Property 9: Passwords are never stored as plaintext

*For any* username and password registered via `POST /register`, the value stored in the user store for that user's password field SHALL NOT equal the plaintext password string.

**Validates: Requirements 6.5**

---

### Property 10: Protected endpoints reject unauthenticated requests

*For any* request to `PUT /customer/auth/review/:isbn` or `DELETE /customer/auth/review/:isbn` that does not include a valid JWT in the `Authorization` header, the API SHALL return HTTP 401.

**Validates: Requirements 8.3, 9.3, 10.3**

---

### Property 11: Review upsert — only the latest review is stored per user per book

*For any* authenticated user and any book in the catalog, submitting two sequential review requests via `PUT /customer/auth/review/:isbn` SHALL result in exactly one review stored for that user on that book, and the stored text SHALL equal the text from the second (most recent) request.

**Validates: Requirements 8.6, 9.2**

---

### Property 12: Review ownership isolation

*For any* two distinct authenticated users A and B, a review submitted by user A for a given book SHALL remain unchanged after user B submits or deletes their own review for the same book. User B's write operations SHALL only affect user B's own review entry.

**Validates: Requirements 9.4, 10.5**

---

### Property 13: Review add-then-delete round-trip

*For any* authenticated user and any book in the catalog, submitting a review via `PUT /customer/auth/review/:isbn` and then deleting it via `DELETE /customer/auth/review/:isbn` SHALL result in the review no longer appearing in the response from `GET /books/review/:isbn`.

**Validates: Requirements 10.2**

---

### Property 14: Async error handling does not crash the server

*For any* route handler that encounters an internal error (simulated via mocked failures), the API SHALL return an appropriate HTTP error response (4xx or 5xx) rather than leaving the request hanging or crashing the server process.

**Validates: Requirements 11.3**

---

## Error Handling

### HTTP Status Code Conventions

| Scenario | Status Code |
|----------|-------------|
| Successful read | 200 |
| Resource created | 201 |
| Bad request (missing/invalid fields) | 400 |
| Unauthenticated (missing/invalid token) | 401 |
| Conflict (duplicate username) | 409 |
| Resource not found | 404 |
| Internal server error | 500 |

### Error Response Format

All error responses use a consistent JSON shape:
```json
{ "message": "Human-readable error description" }
```

### Async Error Handling Pattern

All route handlers wrap async logic in try/catch blocks and pass errors to Express's error handler via `next(err)`, or return explicit error responses:

```javascript
app.get('/books/isbn/:isbn', async (req, res) => {
  try {
    const book = books[req.params.isbn];
    if (!book) return res.status(404).json({ message: 'Book not found' });
    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});
```

### Input Validation

- Registration and login endpoints validate that both `username` and `password` are present in the request body before processing.
- Review endpoints validate that review text is present in the request body.
- Missing required fields return HTTP 400 with a descriptive message.

---

## Testing Strategy

### Dual Testing Approach

Both unit/example-based tests and property-based tests are used for comprehensive coverage.

**Unit tests** cover:
- Specific endpoint behavior with concrete examples (e.g., registering a known user, looking up a known ISBN)
- Edge cases: empty catalog, empty reviews, empty string inputs
- Error conditions: missing fields, wrong credentials, non-existent resources
- Integration between middleware and route handlers (e.g., JWT middleware correctly blocks unauthenticated requests)

**Property-based tests** cover:
- Universal properties that hold across all valid inputs (see Correctness Properties section above)
- Each property test runs a minimum of **100 iterations** to exercise the input space

### Property-Based Testing Configuration

Library: **fast-check** (`npm install --save-dev fast-check`)

Each property test is tagged with a comment referencing the design property:

```javascript
// Feature: book-reviews-api, Property 4: Author search is case-insensitive and returns all matches
test('author search is case-insensitive', () => {
  fc.assert(
    fc.property(fc.string(), fc.array(bookArbitrary()), (author, catalog) => {
      // ... test body
    }),
    { numRuns: 100 }
  );
});
```

### Test Organization

```
tests/
  unit/
    books.test.js        # Catalog retrieval and search endpoints
    auth.test.js         # Registration and login
    reviews.test.js      # Review CRUD endpoints
  property/
    books.property.js    # Properties 1–5
    reviews.property.js  # Properties 6, 11–13
    auth.property.js     # Properties 7–10
    errors.property.js   # Property 14
```

### Smoke Tests

The following are verified as single-execution smoke tests:
- All required endpoints exist and respond (not 404)
- Server starts successfully with valid configuration
- Async route handlers are non-blocking (verified via code structure)

### Integration Tests

- Concurrent request handling: send multiple simultaneous requests and verify all complete with correct responses (Requirement 11.2)
