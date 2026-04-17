const express = require('express');
const bcrypt = require('bcrypt');
const { books, users } = require('../db.js');

const publicRouter = express.Router();

/**
 * POST /register
 * Validates username and password, rejects duplicates, hashes password
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
publicRouter.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Check for duplicate username
    if (users[username]) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Store user
    users[username] = {
      username,
      password: hashedPassword
    };
    
    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /books
 * Returns all books as a JSON array
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
publicRouter.get('/books', async (req, res) => {
  try {
    const bookArray = Object.values(books);
    return res.status(200).json(bookArray);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /books/isbn/:isbn
 * Returns the book with matching ISBN or 404 if not found
 * Requirements: 2.1, 2.2, 2.3
 */
publicRouter.get('/books/isbn/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;
    const book = books[isbn];
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /books/author/:author
 * Returns books with case-insensitive author match
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
publicRouter.get('/books/author/:author', async (req, res) => {
  try {
    const { author } = req.params;
    const matchingBooks = Object.values(books).filter(
      book => book.author.toLowerCase() === author.toLowerCase()
    );
    
    if (matchingBooks.length === 0) {
      return res.status(404).json({ message: 'No books found by this author' });
    }
    
    return res.status(200).json(matchingBooks);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /books/title/:title
 * Returns books with case-insensitive title match
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
publicRouter.get('/books/title/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const matchingBooks = Object.values(books).filter(
      book => book.title.toLowerCase() === title.toLowerCase()
    );
    
    if (matchingBooks.length === 0) {
      return res.status(404).json({ message: 'No books found with this title' });
    }
    
    return res.status(200).json(matchingBooks);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /books/review/:isbn
 * Returns reviews for a book (empty object if no reviews)
 * Returns 404 if book doesn't exist
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
publicRouter.get('/books/review/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;
    const book = books[isbn];
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    return res.status(200).json(book.reviews);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = publicRouter;
