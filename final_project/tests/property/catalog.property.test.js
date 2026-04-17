const request = require('supertest');
const fc = require('fast-check');
const app = require('../../src/app.js');
const { books } = require('../../src/db.js');

// Arbitrary for generating book ISBN combinations
const isbnArbitrary = () => fc.constantFrom(...Object.keys(books));
const authorArbitrary = () => fc.constantFrom(...new Set(Object.values(books).map(b => b.author)));
const titleArbitrary = () => fc.constantFrom(...new Set(Object.values(books).map(b => b.title)));

describe('Property: Book Catalog Operations', () => {
  beforeEach(() => {
    // Clear reviews
    Object.keys(books).forEach(isbn => {
      books[isbn].reviews = {};
    });
  });

  // Property 1: Book catalog retrieval returns all books with required fields
  test('Property 1: Book catalog retrieval returns all books with required fields', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(undefined), async () => {
        const response = await request(app).get('/books');
        
        // Should return 200
        expect(response.status).toBe(200);
        
        // Should return array
        expect(Array.isArray(response.body)).toBe(true);
        
        // Each book should have required fields
        response.body.forEach(book => {
          expect(book).toHaveProperty('isbn');
          expect(book).toHaveProperty('title');
          expect(book).toHaveProperty('author');
          expect(typeof book.isbn).toBe('string');
          expect(typeof book.title).toBe('string');
          expect(typeof book.author).toBe('string');
        });
        
        // Should match catalog size
        expect(response.body.length).toBe(Object.keys(books).length);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  // Property 2: ISBN lookup is a round-trip
  test('Property 2: ISBN lookup is a round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(isbnArbitrary(), async (isbn) => {
        const response = await request(app).get(`/books/isbn/${encodeURIComponent(isbn)}`);
        
        // Should return 200
        expect(response.status).toBe(200);
        
        // ISBN should match
        expect(response.body.isbn).toBe(isbn);
        
        // Should have title and author
        expect(response.body.title).toBe(books[isbn].title);
        expect(response.body.author).toBe(books[isbn].author);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  // Property 3: ISBN lookup returns 404 for absent ISBNs
  test('Property 3: ISBN lookup returns 404 for absent ISBNs', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (isbn) => {
        // Only test ISBNs that don't exist in catalog
        if (books[isbn]) return true;
        
        const response = await request(app).get(`/books/isbn/${encodeURIComponent(isbn)}`);
        
        // Should return 404
        expect(response.status).toBe(404);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  // Property 4: Author search is case-insensitive and returns all matches
  test('Property 4: Author search is case-insensitive and returns all matches', async () => {
    await fc.assert(
      fc.asyncProperty(authorArbitrary(), fc.constantFrom(0, 0.5, 1), async (author, caseVariation) => {
        // Generate case variations
        let searchAuthor = author;
        if (caseVariation < 0.5) {
          searchAuthor = author.toUpperCase();
        } else if (caseVariation >= 0.5) {
          searchAuthor = author.toLowerCase();
        }
        
        const response = await request(app).get(`/books/author/${encodeURIComponent(searchAuthor)}`);
        
        // Should return 200
        expect(response.status).toBe(200);
        
        // Should return array
        expect(Array.isArray(response.body)).toBe(true);
        
        // All returned books should have matching author (case-insensitive)
        response.body.forEach(book => {
          expect(book.author.toLowerCase()).toBe(author.toLowerCase());
        });
        
        // Should include all matching books
        const allMatching = Object.values(books).filter(
          b => b.author.toLowerCase() === author.toLowerCase()
        );
        expect(response.body.length).toBe(allMatching.length);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  // Property 5: Title search is case-insensitive and returns all matches
  test('Property 5: Title search is case-insensitive and returns all matches', async () => {
    await fc.assert(
      fc.asyncProperty(titleArbitrary(), fc.constantFrom(0, 0.5, 1), async (title, caseVariation) => {
        // Generate case variations
        let searchTitle = title;
        if (caseVariation < 0.5) {
          searchTitle = title.toUpperCase();
        } else if (caseVariation >= 0.5) {
          searchTitle = title.toLowerCase();
        }
        
        const response = await request(app).get(`/books/title/${encodeURIComponent(searchTitle)}`);
        
        // Should return 200
        expect(response.status).toBe(200);
        
        // Should return array
        expect(Array.isArray(response.body)).toBe(true);
        
        // All returned books should have matching title (case-insensitive)
        response.body.forEach(book => {
          expect(book.title.toLowerCase()).toBe(title.toLowerCase());
        });
        
        // Should include all matching books
        const allMatching = Object.values(books).filter(
          b => b.title.toLowerCase() === title.toLowerCase()
        );
        expect(response.body.length).toBe(allMatching.length);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  // Property 6: Review retrieval round-trip
  test('Property 6: Review retrieval round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        isbnArbitrary(),
        fc.object({ maxKeys: 5, values: [fc.string({ maxLength: 20 })] }),
        async (isbn, reviewsObj) => {
          // Clear reviews and set new ones
          books[isbn].reviews = {};
          
          // Add reviews
          Object.entries(reviewsObj).forEach(([user, text]) => {
            if (text && typeof text === 'string') {
              books[isbn].reviews[user] = text.slice(0, 100); // Limit text length
            }
          });
          
          const response = await request(app).get(`/books/review/${encodeURIComponent(isbn)}`);
          
          // Should return 200
          expect(response.status).toBe(200);
          
          // Should return reviews object
          expect(typeof response.body).toBe('object');
          
          // Should match stored reviews
          Object.entries(books[isbn].reviews).forEach(([user, text]) => {
            expect(response.body[user]).toBe(text);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
