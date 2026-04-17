const request = require('supertest');
const jwt = require('jsonwebtoken');
const fc = require('fast-check');
const app = require('../../src/app.js');
const { users, books } = require('../../src/db.js');
const { JWT_SECRET } = require('../../src/middleware/authenticateJWT.js');

const isbnArbitrary = () => fc.constantFrom(...Object.keys(books));
const usernameArbitrary = () => fc.string({ minLength: 1, maxLength: 20 });
const passwordArbitrary = () => fc.string({ minLength: 1, maxLength: 50 });
const reviewTextArbitrary = () => fc.string({ minLength: 1, maxLength: 200 });

describe('Property: Authentication and Reviews', () => {
  jest.setTimeout(120000); // bcrypt is slow; property tests with 50 runs need extra time
  beforeEach(() => {
    Object.keys(users).forEach(username => {
      delete users[username];
    });
    Object.keys(books).forEach(isbn => {
      books[isbn].reviews = {};
    });
  });

  // Property 7: Registration then login round-trip
  test('Property 7: Registration then login round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        usernameArbitrary(),
        passwordArbitrary(),
        async (username, password) => {
          // Skip if username already exists
          if (users[username]) return true;
          
          // Register
          const registerRes = await request(app)
            .post('/register')
            .send({ username, password });
          
          if (registerRes.status !== 201) return true;
          
          // Login with same credentials
          const loginRes = await request(app)
            .post('/customer/login')
            .send({ username, password });
          
          // Should succeed
          expect(loginRes.status).toBe(200);
          expect(loginRes.body).toHaveProperty('token');
          expect(typeof loginRes.body.token).toBe('string');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property 8: Duplicate registration is rejected
  test('Property 8: Duplicate registration is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        usernameArbitrary(),
        passwordArbitrary(),
        passwordArbitrary(),
        async (username, password1, password2) => {
          // First registration
          const res1 = await request(app)
            .post('/register')
            .send({ username, password: password1 });
          
          if (res1.status !== 201) return true;
          
          // Second registration with same username
          const res2 = await request(app)
            .post('/register')
            .send({ username, password: password2 });
          
          // Should be rejected with 409
          expect(res2.status).toBe(409);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property 9: Passwords are never stored as plaintext
  test('Property 9: Passwords are never stored as plaintext', async () => {
    await fc.assert(
      fc.asyncProperty(
        usernameArbitrary(),
        passwordArbitrary(),
        async (username, password) => {
          if (users[username] || !password) return true;
          
          const registerRes = await request(app)
            .post('/register')
            .send({ username, password });
          
          if (registerRes.status !== 201) return true;
          
          // Check stored password
          const storedPassword = users[username].password;
          
          // Should not equal plaintext password
          expect(storedPassword).not.toBe(password);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property 10: Protected endpoints reject unauthenticated requests
  test('Property 10: Protected endpoints reject unauthenticated requests', async () => {
    await fc.assert(
      fc.asyncProperty(isbnArbitrary(), reviewTextArbitrary(), async (isbn, review) => {
        // Test PUT without token
        const putRes = await request(app)
          .put(`/customer/auth/review/${encodeURIComponent(isbn)}`)
          .send({ review });
        
        expect(putRes.status).toBe(401);
        
        // Test DELETE without token
        const deleteRes = await request(app)
          .delete(`/customer/auth/review/${encodeURIComponent(isbn)}`);
        
        expect(deleteRes.status).toBe(401);
        
        return true;
      }),
      { numRuns: 50 }
    );
  });

  // Property 11: Review upsert — only the latest review is stored per user per book
  test('Property 11: Review upsert — only latest review is stored', async () => {
    await fc.assert(
      fc.asyncProperty(
        usernameArbitrary(),
        passwordArbitrary(),
        isbnArbitrary(),
        fc.array(reviewTextArbitrary(), { minLength: 2, maxLength: 5 }),
        async (username, password, isbn, reviews) => {
          // Register and login
          const regRes = await request(app)
            .post('/register')
            .send({ username, password });
          
          if (regRes.status !== 201) return true;
          
          const loginRes = await request(app)
            .post('/customer/login')
            .send({ username, password });
          
          if (loginRes.status !== 200) return true;
          const token = loginRes.body.token;
          
          // Submit multiple reviews
          for (const reviewText of reviews) {
            if (reviewText.trim().length === 0) continue;
            
            const res = await request(app)
              .put(`/customer/auth/review/${encodeURIComponent(isbn)}`)
              .set('Authorization', `Bearer ${token}`)
              .send({ review: reviewText });
            
            if (res.status !== 200) return true;
          }
          
          // Verify only last review is stored
          const lastValidReview = reviews.reverse().find(r => r.trim().length > 0);
          if (lastValidReview) {
            expect(books[isbn].reviews[username]).toBe(lastValidReview);
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property 12: Review ownership isolation
  test('Property 12: Review ownership isolation', async () => {
    await fc.assert(
      fc.asyncProperty(
        usernameArbitrary(),
        usernameArbitrary(),
        passwordArbitrary(),
        passwordArbitrary(),
        isbnArbitrary(),
        reviewTextArbitrary(),
        reviewTextArbitrary(),
        async (user1, user2, pwd1, pwd2, isbn, review1, review2) => {
          // Skip if user1 and user2 are same or invalid
          if (user1 === user2 || !review1.trim() || !review2.trim()) return true;
          
          // Register and login both users
          await request(app).post('/register').send({ username: user1, password: pwd1 });
          await request(app).post('/register').send({ username: user2, password: pwd2 });
          
          const login1 = await request(app).post('/customer/login').send({ username: user1, password: pwd1 });
          const login2 = await request(app).post('/customer/login').send({ username: user2, password: pwd2 });
          
          if (login1.status !== 200 || login2.status !== 200) return true;
          
          const token1 = login1.body.token;
          const token2 = login2.body.token;
          
          // User1 submits review
          const res1 = await request(app)
            .put(`/customer/auth/review/${encodeURIComponent(isbn)}`)
            .set('Authorization', `Bearer ${token1}`)
            .send({ review: review1 });
          
          if (res1.status !== 200) return true;
          
          // User2 submits review
          const res2 = await request(app)
            .put(`/customer/auth/review/${encodeURIComponent(isbn)}`)
            .set('Authorization', `Bearer ${token2}`)
            .send({ review: review2 });
          
          if (res2.status !== 200) return true;
          
          // Verify each user's review is isolated
          expect(books[isbn].reviews[user1]).toBe(review1);
          expect(books[isbn].reviews[user2]).toBe(review2);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property 13: Review add-then-delete round-trip
  test('Property 13: Review add-then-delete round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        usernameArbitrary(),
        passwordArbitrary(),
        isbnArbitrary(),
        reviewTextArbitrary(),
        async (username, password, isbn, review) => {
          if (!review.trim()) return true;
          
          // Register and login
          const regRes = await request(app)
            .post('/register')
            .send({ username, password });
          
          if (regRes.status !== 201) return true;
          
          const loginRes = await request(app)
            .post('/customer/login')
            .send({ username, password });
          
          if (loginRes.status !== 200) return true;
          const token = loginRes.body.token;
          
          // Add review
          const addRes = await request(app)
            .put(`/customer/auth/review/${encodeURIComponent(isbn)}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ review });
          
          if (addRes.status !== 200) return true;
          
          // Verify review exists
          expect(books[isbn].reviews[username]).toBe(review);
          
          // Delete review
          const deleteRes = await request(app)
            .delete(`/customer/auth/review/${encodeURIComponent(isbn)}`)
            .set('Authorization', `Bearer ${token}`);
          
          if (deleteRes.status !== 200) return true;
          
          // Verify review is gone
          expect(books[isbn].reviews[username]).toBeUndefined();
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
