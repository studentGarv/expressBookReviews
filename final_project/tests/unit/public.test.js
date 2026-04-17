const request = require('supertest');
const app = require('../../src/app.js');
const { books } = require('../../src/db.js');

describe('Public Endpoints - Books', () => {
  // Reset books state before each test to avoid contamination
  beforeEach(() => {
    // Clear reviews
    Object.keys(books).forEach(isbn => {
      books[isbn].reviews = {};
    });
  });

  describe('GET /books', () => {
    test('should return all books with required fields', async () => {
      const response = await request(app).get('/books');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verify each book has required fields
      response.body.forEach(book => {
        expect(book).toHaveProperty('isbn');
        expect(book).toHaveProperty('title');
        expect(book).toHaveProperty('author');
      });
    });
  });

  describe('GET /books/isbn/:isbn', () => {
    test('should return a book by existing ISBN', async () => {
      const isbn = '9780141439570';
      const response = await request(app).get(`/books/isbn/${isbn}`);
      
      expect(response.status).toBe(200);
      expect(response.body.isbn).toBe(isbn);
      expect(response.body.title).toBe('Things Fall Apart');
      expect(response.body.author).toBe('Chinua Achebe');
    });

    test('should return 404 for non-existent ISBN', async () => {
      const response = await request(app).get('/books/isbn/9999999999999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /books/author/:author', () => {
    test('should return books by author (case-insensitive)', async () => {
      const response = await request(app).get('/books/author/Chinua%20Achebe');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].author).toBe('Chinua Achebe');
    });

    test('should return books by author with different casing', async () => {
      const response = await request(app).get('/books/author/chinua%20achebe');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should return 404 for non-existent author', async () => {
      const response = await request(app).get('/books/author/NonExistent%20Author');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /books/title/:title', () => {
    test('should return books by title (case-insensitive)', async () => {
      const response = await request(app).get('/books/title/Things%20Fall%20Apart');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Things Fall Apart');
    });

    test('should return books by title with different casing', async () => {
      const response = await request(app).get('/books/title/things%20fall%20apart');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should return 404 for non-existent title', async () => {
      const response = await request(app).get('/books/title/NonExistent%20Title');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /books/review/:isbn', () => {
    test('should return empty object when no reviews exist', async () => {
      const isbn = '9780141439570';
      const response = await request(app).get(`/books/review/${isbn}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    test('should return reviews when they exist', async () => {
      const isbn = '9780141439570';
      books[isbn].reviews['user1'] = 'Great book!';
      books[isbn].reviews['user2'] = 'Loved it!';
      
      const response = await request(app).get(`/books/review/${isbn}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user1', 'Great book!');
      expect(response.body).toHaveProperty('user2', 'Loved it!');
    });

    test('should return 404 for non-existent ISBN', async () => {
      const response = await request(app).get('/books/review/9999999999999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
});
