// In-memory data store for books and users
// Books are keyed by ISBN
const books = {
  "9780141439570": {
    isbn: "9780141439570",
    title: "Things Fall Apart",
    author: "Chinua Achebe",
    reviews: {}
  },
  "9780142410394": {
    isbn: "9780142410394",
    title: "Fairy tales",
    author: "Hans Christian Andersen",
    reviews: {}
  },
  "9780142437230": {
    isbn: "9780142437230",
    title: "The Divine Comedy",
    author: "Dante Alighieri",
    reviews: {}
  },
  "9780140268867": {
    isbn: "9780140268867",
    title: "The Epic Of Gilgamesh",
    author: "Unknown",
    reviews: {}
  },
  "9780140044676": {
    isbn: "9780140044676",
    title: "The Book Of Job",
    author: "Unknown",
    reviews: {}
  },
  "9780140439792": {
    isbn: "9780140439792",
    title: "One Thousand and One Nights",
    author: "Unknown",
    reviews: {}
  },
  "9780141191356": {
    isbn: "9780141191356",
    title: "Njál's Saga",
    author: "Unknown",
    reviews: {}
  },
  "9780141439518": {
    isbn: "9780141439518",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    reviews: {}
  },
  "9780140435405": {
    isbn: "9780140435405",
    title: "Le Père Goriot",
    author: "Honoré de Balzac",
    reviews: {}
  },
  "9780141182735": {
    isbn: "9780141182735",
    title: "Molloy, Malone Dies, The Unnamable, the trilogy",
    author: "Samuel Beckett",
    reviews: {}
  }
};

// Users registry: { [username]: { username, password } }
// password is stored hashed via bcrypt
const users = {};

module.exports = { books, users };
