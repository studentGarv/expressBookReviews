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
    const response = await axios.get("http://localhost:5000/books");
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching books:", error.message);
    // Fallback to local books if server is not fully running yet
    return res.status(200).json(books);
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const { isbn } = req.params;

  axios.get("http://localhost:5000/books")
    .then(response => {
      const booksData = response.data;
      if (booksData[isbn]) {
        return res.status(200).json(booksData[isbn]);
      } else {
        return res.status(404).json({ message: "Book not found" });
      }
    })
    .catch(error => {
      console.error("Error fetching books:", error.message);
      // Fallback
      if (books[isbn]) {
        return res.status(200).json(books[isbn]);
      }
      return res.status(404).json({ message: "Book not found" });
    });
});
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  try {
    const authorParam = req.params.author.toLowerCase();
    
    // Using Axios to fetch data
    const response = await axios.get("http://localhost:5000/books");
    const booksData = response.data;
    
    const keys = Object.keys(booksData);
    let matchingBooks = [];
    
    keys.forEach(key => {
      if (booksData[key].author.toLowerCase() === authorParam) {
        matchingBooks.push(booksData[key]);
      }
    });
    
    if (matchingBooks.length > 0) {
      return res.status(200).json(matchingBooks);
    } else {
      return res.status(404).json({ message: "No books found by this author" });
    }
  } catch (error) {
    console.error("Error fetching by author:", error.message);
    return res.status(500).json({message: "Internal server error"});
  }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const titleParam = req.params.title.toLowerCase();

  axios.get("http://localhost:5000/books")
    .then(response => {
      const booksData = response.data;
      const keys = Object.keys(booksData);
      let matchingBooks = [];
      
      keys.forEach(key => {
        if (booksData[key].title.toLowerCase() === titleParam) {
          matchingBooks.push(booksData[key]);
        }
      });
      
      if (matchingBooks.length > 0) {
        return res.status(200).json(matchingBooks);
      } else {
        return res.status(404).json({ message: "No books found with this title" });
      }
    })
    .catch(error => {
      console.error("Error fetching by title:", error.message);
      return res.status(500).json({message: "Internal server error"});
    });
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

// Mock "External" API endpoint for Axios to hit
public_users.get('/books', function (req, res) {
  return res.status(200).json(books);
});

module.exports.general = public_users;
