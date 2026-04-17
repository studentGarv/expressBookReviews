const express = require('express');
const session = require('express-session');
const publicRouter = require('./routes/public.js');
const customerRouter = require('./routes/customer.js');
const authenticatedRouter = require('./routes/authenticated.js');

const app = express();

// Middleware
app.use(express.json());

// Session configuration
app.use(session({
  secret: 'fingerprint_customer',
  resave: false,
  saveUninitialized: true
}));

// Mount routers
app.use('/', publicRouter);
app.use('/customer', customerRouter);
app.use('/customer/auth', authenticatedRouter);

// Global error handler
app.use((err, req, res, next) => {
  // console.error(err); // commented out to avoid test noise
  return res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
