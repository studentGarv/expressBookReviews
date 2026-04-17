const express = require('express');
const { books } = require('../db.js');
const { authenticateJWT } = require('../middleware/authenticateJWT.js');

const authenticatedRouter = express.Router();

// Apply JWT authentication to all routes in this router
authenticatedRouter.use(authenticateJWT);

/**
 * PUT /customer/auth/review/:isbn
 * Upsert a review for an authenticated user
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2
 */
authenticatedRouter.put('/review/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;
    const { review } = req.body;
    const username = req.user.username;
    
    // Validate review text
    if (!review || review.trim() === '') {
      return res.status(400).json({ message: 'Review text is required' });
    }
    
    // Check if book exists
    const book = books[isbn];
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Upsert review
    book.reviews[username] = review;
    
    return res.status(200).json({ message: 'Review submitted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /customer/auth/review/:isbn
 * Delete a user's review for a book
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
authenticatedRouter.delete('/review/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;
    const username = req.user.username;
    
    // Check if book exists
    const book = books[isbn];
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if user has a review for this book
    if (!book.reviews[username]) {
      return res.status(404).json({ message: 'No review found for this user on this book' });
    }
    
    // Delete the review
    delete book.reviews[username];
    
    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = authenticatedRouter;
