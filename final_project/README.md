# Express Book Reviews API

This project is a RESTful API for a Book Review application, built using Node.js and Express.js. It serves as the final project for the IBM Full Stack Developer certification.

## Features

### General Users (Unauthenticated)
- **Get all books**: Retrieve a list of all available books (implemented using Axios with async/await).
- **Get book by ISBN**: Search and retrieve book details by ISBN (implemented using Axios with Promises).
- **Get books by Author**: Search for books by a specific author (implemented using Axios with async/await).
- **Get books by Title**: Search for books by title (implemented using Axios with Promises).
- **Get book reviews**: View reviews for a specific book.
- **Register**: Create a new user account.

### Registered Users (Authenticated)
- **Login**: Authenticate with a username and password to receive a JSON Web Token (JWT).
- **Add/Modify a Review**: Add a new review or modify an existing review for a book using JWT auth.
- **Delete a Review**: Delete a review that the user has previously posted.

## Technology Stack
- **Backend Framework**: Node.js, Express.js
- **Authentication / Session**: JSON Web Tokens (JWT), Express-Session
- **Security**: bcrypt (for password hashing)
- **HTTP Client**: Axios (used internally for fetching data to satisfy assignment requirements)
- **Testing**: Jest, Supertest

## Installation and Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/studentGarv/expressBookReviews.git
   cd expressBookReviews/final_project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   The server will start on `http://localhost:5000`.

## API Endpoints Overview

### Public Routes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all books |
| GET | `/isbn/:isbn` | Get book details by ISBN |
| GET | `/author/:author` | Get books by author |
| GET | `/title/:title` | Get books by title |
| GET | `/review/:isbn` | Get reviews for a specific book |
| POST | `/register` | Register a new user |
| POST | `/customer/login` | Login and receive a JWT token |

### Authenticated Routes (Requires Bearer Token)
| Method | Endpoint | Description |
|---|---|---|
| PUT | `/customer/auth/review/:isbn` | Add or modify a user's book review |
| DELETE | `/customer/auth/review/:isbn` | Delete a connected user's book review |