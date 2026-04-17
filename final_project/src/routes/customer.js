const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { users } = require('../db.js');
const { JWT_SECRET } = require('../middleware/authenticateJWT.js');

const customerRouter = express.Router();

/**
 * POST /customer/login
 * Validates credentials with bcrypt, establishes session, issues JWT
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
customerRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Check if user exists
    const user = users[username];
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Establish session
    req.session.user = username;
    
    // Issue JWT
    const token = jwt.sign(
      { username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = customerRouter;
