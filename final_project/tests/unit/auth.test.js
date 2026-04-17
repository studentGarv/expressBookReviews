const request = require('supertest');
const app = require('../../src/app.js');
const { users } = require('../../src/db.js');

describe('Authentication Endpoints', () => {
  // Reset users before each test
  beforeEach(() => {
    Object.keys(users).forEach(username => {
      delete users[username];
    });
  });

  describe('POST /register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/register')
        .send({ username: 'testuser', password: 'password123' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(users).toHaveProperty('testuser');
    });

    test('should reject duplicate username', async () => {
      // First registration
      await request(app)
        .post('/register')
        .send({ username: 'testuser', password: 'password123' });
      
      // Second registration with same username
      const response = await request(app)
        .post('/register')
        .send({ username: 'testuser', password: 'differentpassword' });
      
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message');
    });

    test('should reject registration without username', async () => {
      const response = await request(app)
        .post('/register')
        .send({ password: 'password123' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    test('should reject registration without password', async () => {
      const response = await request(app)
        .post('/register')
        .send({ username: 'testuser' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    test('should hash password before storing', async () => {
      const plainPassword = 'password123';
      
      const response = await request(app)
        .post('/register')
        .send({ username: 'testuser', password: plainPassword });
      
      expect(response.status).toBe(201);
      const storedPassword = users['testuser'].password;
      
      // Password should not be plaintext
      expect(storedPassword).not.toBe(plainPassword);
    });
  });

  describe('POST /customer/login', () => {
    beforeEach(async () => {
      // Register a user before login tests
      await request(app)
        .post('/register')
        .send({ username: 'testuser', password: 'password123' });
    });

    test('should login with valid credentials and return token', async () => {
      const response = await request(app)
        .post('/customer/login')
        .send({ username: 'testuser', password: 'password123' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    test('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/customer/login')
        .send({ username: 'testuser', password: 'wrongpassword' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    test('should reject login with non-existent username', async () => {
      const response = await request(app)
        .post('/customer/login')
        .send({ username: 'nonexistent', password: 'password123' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    test('should reject login without username', async () => {
      const response = await request(app)
        .post('/customer/login')
        .send({ password: 'password123' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    test('should reject login without password', async () => {
      const response = await request(app)
        .post('/customer/login')
        .send({ username: 'testuser' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });
});
