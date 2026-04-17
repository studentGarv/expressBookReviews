const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }

  const userExists = users.some(user => user.username === username);
  if (userExists) {
    return res.status(409).json({message: "Username already exists"});
  }

  users.push({ username, password });
  return res.status(201).json({message: "User successfully registered. You can now login."});
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  try {
    const getBooks = new Promise((resolve) => {
      resolve(books);
    });
    
    const bookList = await getBooks;
    res.status(200).send(JSON.stringify(bookList, null, 4));
  } catch (error) {
    res.status(500).json({message: "Error retrieving books"});
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const { isbn } = req.params;

  const getBookByIsbn = new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject({ status: 404, message: "Book not found" });
    }
  });

  getBookByIsbn
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(error.status || 500).json({message: error.message}));
});
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  try {
    const authorParam = req.params.author.toLowerCase();
    
    const getBooksByAuthor = new Promise((resolve, reject) => {
      const keys = Object.keys(books);
      let matchingBooks = [];
      
      keys.forEach(key => {
        if (books[key].author.toLowerCase() === authorParam) {
          matchingBooks.push(books[key]);
        }
      });
      
      if (matchingBooks.length > 0) {
        resolve(matchingBooks);
      } else {
        reject({ status: 404, message: "No books found by this author" });
      }
    });

    const result = await getBooksByAuthor;
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({message: error.message});
  }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const titleParam = req.params.title.toLowerCase();

  const getBooksByTitle = new Promise((resolve, reject) => {
    const keys = Object.keys(books);
    let matchingBooks = [];
    
    keys.forEach(key => {
      if (books[key].title.toLowerCase() === titleParam) {
        matchingBooks.push(books[key]);
      }
    });
    
    if (matchingBooks.length > 0) {
      resolve(matchingBooks);
    } else {
      reject({ status: 404, message: "No books found with this title" });
    }
  });

  getBooksByTitle
    .then((result) => res.status(200).json(result))
    .catch((error) => res.status(error.status || 500).json({message: error.message}));
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const { isbn } = req.params;
  if (books[isbn]) {
    return res.status(200).json(books[isbn].reviews);
  } else {
    return res.status(404).json({message: "Book not found"});
  }
});

// -------------------------------------------------------------------------
// TASKS 10-13: AXIOS CLIENT IMPLEMENTATIONS
// The instructions require demonstrating the use of Axios to fetch data.
// These functions act as an external client making requests to our REST API.
// -------------------------------------------------------------------------

// Task 10: Get all books using an async callback function with Axios
const getAllBooks = async () => {
  try {
    const response = await axios.get('http://localhost:5000/');
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

// Task 11: Search by ISBN using Promises with Axios
const getBookByISBN = (isbn) => {
  axios.get(`http://localhost:5000/isbn/${isbn}`)
    .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.error(error);
    });
};

// Task 12: Search by Author using async/await with Axios
const getBooksByAuthor = async (author) => {
  try {
    const response = await axios.get(`http://localhost:5000/author/${author}`);
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

// Task 13: Search by Title using Promises with Axios
const getBooksByTitle = (title) => {
  axios.get(`http://localhost:5000/title/${title}`)
    .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.error(error);
    });
};

module.exports.general = public_users;
