const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app.js');
const { users, books } = require('../../src/db.js');
const { JWT_SECRET } = require('../../src/middleware/authenticateJWT.js');

describe('Review Endpoints (Authenticated)', () => {
  let token1, token2;
  const isbn = '9780141439570';

  beforeEach(async () => {
    // Clear users and reviews
    Object.keys(users).forEach(username => {
      delete users[username];
    });
    Object.keys(books).forEach(key => {
      books[key].reviews = {};
    });

    // Register and get tokens for two users
    await request(app)
      .post('/register')
      .send({ username: 'user1', password: 'password123' });
    
    await request(app)
      .post('/register')
      .send({ username: 'user2', password: 'password456' });

    const login1 = await request(app)
      .post('/customer/login')
      .send({ username: 'user1', password: 'password123' });
    
    const login2 = await request(app)
      .post('/customer/login')
      .send({ username: 'user2', password: 'password456' });

    token1 = login1.body.token;
    token2 = login2.body.token;
  });

  describe('PUT /customer/auth/review/:isbn', () => {
    test('should create a new review', async () => {
      const response = await request(app)
        .put(`/customer/auth/review/${isbn}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ review: 'Great book!' });
      
      expect(response.status).toBe(200);
      expect(books[isbn].reviews['user1']).toBe('Great book!');
    });

    test('should replace existing review (upsert)', async () => {
      // First review
      await request(app)
        .put(`/customer/auth/review/${isbn}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ review: 'Good book' });

      // Second review (should replace)
      const response = await request(app)
        .put(`/customer/auth/review/${isbn}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ review: 'Excellent book!' });
      
      expect(response.status).toBe(200);
      expect(books[isbn].reviews['user1']).toBe('Excellent book!');
      expect(Object.keys(books[isbn].reviews).filter(u => u === 'user1').length).toBe(1);
    });

    test('should return 401 without valid JWT', async () => {
      const response = await request(app)
        .put(`/customer/auth/review/${isbn}`)
        .send({ review: 'Great book!' });
      
      expect(response.status).toBe(401);
    });

    test('should return 401 with invalid JWT', async () => {
      const response = await request(app)
        .put(`/customer/auth/review/${isbn}`)
        .set('Authorization', 'Bearer invalidtoken')
        .send({ review: 'Great book!' });
      
      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .put(`/customer/auth/review/9999999999999`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ review: 'Great book!' });
      
      expect(response.status).toBe(404);
    });

    test('should return 400 without review text', async () => {
      const response = await request(app)
        .put(`/customer/auth/review/${isbn}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({});
      
      expect(response.status).toBe(400);
    });

    test('should return 400 with empty review text', async () => {
      const response = await request(app)
        .put(`/customer/auth/review/${isbn}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ review: '   ' });
      
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /customer/auth/review/:isbn', () => {
    beforeEach(async () => {
      // Add reviews for both users
      await request(app)
        .put(`/customer/auth/review/${isbn}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ review: 'Great book!' });
      
      await request(app)
        .put(`/customer/auth/review/${isbn}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ review: 'Good book!' });
    });

    test('should delete user\'s own review', async () => {
      const response = await request(app)
        .delete(`/customer/auth/review/${isbn}`)
        .set('Authorization', `Bearer ${token1}`);
      
      expect(response.status).toBe(200);
      expect(books[isbn].reviews['user1']).toBeUndefined();
      expect(books[isbn].reviews['user2']).toBe('Good book!');
    });

    test('should return 401 without valid JWT', async () => {
      const response = await request(app)
        .delete(`/customer/auth/review/${isbn}`);
      
      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .delete(`/customer/auth/review/9999999999999`)
        .set('Authorization', `Bearer ${token1}`);
      
      expect(response.status).toBe(404);
    });

    test('should return 404 when user has no review for this book', async () => {
      const isbn2 = '9780142410394';
      const response = await request(app)
        .delete(`/customer/auth/review/${isbn2}`)
        .set('Authorization', `Bearer ${token1}`);
      
      expect(response.status).toBe(404);
    });

    test('should not allow deleting another user\'s review', async () => {
      // User1 tries to delete User2's review
      const response = await request(app)
        .delete(`/customer/auth/review/${isbn}`)
        .set('Authorization', `Bearer ${token1}`);
      
      // User1's review is deleted
      expect(response.status).toBe(200);
      
      // User2's review should still exist
      expect(books[isbn].reviews['user2']).toBe('Good book!');
    });
  });
});
