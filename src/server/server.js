require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jwt-simple');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// MySQL Database Connection using environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST, // Use DB_HOST from .env
  user: process.env.DB_USER, // Use DB_USER from .env
  password: process.env.DB_PASSWORD, // Use DB_PASSWORD from .env
  database: process.env.DB_NAME, // Use DB_NAME from .env
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

// JWT Secret Key from environment variable
const SECRET_KEY = process.env.JWT_SECRET_KEY; // Use JWT_SECRET_KEY from .env

// Middleware to verify JWT and extract user data
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send('No token provided');
  }

  // Remove 'Bearer ' prefix from token
  const tokenWithoutBearer = token.split(' ')[1];

  try {
    // Decode the token
    const decoded = jwt.decode(tokenWithoutBearer, SECRET_KEY);
    req.user = decoded; // Attach user data to the request
    next(); // Continue to the next middleware or route handler
  } catch (err) {
    return res.status(500).send('Failed to authenticate token');
  }
}

// Route for User Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Query to get the user by username
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).send('Error querying database');
    }
    if (results.length === 0) {
      console.log('User not found:', username);
      return res.status(401).send('User not found');
    }

    const user = results[0];

    // Compare entered password with the stored plaintext password
    if (password === user.password) {
      const token = jwt.encode({ userId: user.user_id, role: user.role }, SECRET_KEY);
      res.json({ token });
    } else {
      res.status(401).send('Invalid credentials');
    }
  });
});

// Route for Fetching Available Books
app.get('/api/books', (req, res) => {
  db.query('SELECT * FROM books WHERE stock > 0', (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Error fetching books');
    }
    res.json(results); // Return the list of books that have stock > 0
  });
});

// Route for Borrowing a Book
app.post('/api/borrow-book', verifyToken, (req, res) => {
  const { bookId } = req.body;

  if (!bookId) {
    return res.status(400).send('Book ID is required');
  }

  // Check if the book is available
  db.query('SELECT * FROM books WHERE book_id = ? AND stock > 0', [bookId], (err, results) => {
    if (err) {
      console.error('Error checking book stock:', err);
      return res.status(500).send('Error checking book stock');
    }

    if (results.length === 0) {
      return res.status(404).send('Book not available');
    }

    // Insert the borrowed book record with due date as 14 days from borrow date
    db.query(
      'INSERT INTO borrowed_books (user_id, book_id, borrow_date, due_date) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY))',
      [req.user.userId, bookId],
      (err, results) => {
        if (err) {
          console.error('Error inserting borrowed book:', err);
          return res.status(500).send('Error borrowing book');
        }

        // Update the stock of the book
        db.query(
          'UPDATE books SET stock = stock - 1 WHERE book_id = ?',
          [bookId],
          (err) => {
            if (err) {
              console.error('Error updating book stock:', err);
              return res.status(500).send('Error updating book stock');
            }
            res.status(200).send('Book borrowed successfully');
          }
        );
      }
    );
  });
});

// Route for Fetching Borrowed Books (Staff only)
app.get('/api/borrowed-books', verifyToken, (req, res) => {
  if (req.user.role !== 'staff') {
    return res.status(403).send('Access denied. Staff only.');
  }

  db.query(
    `SELECT bb.borrow_id, bb.borrow_date, bb.due_date, u.full_name, b.title, bb.book_id
     FROM borrowed_books bb
     JOIN users u ON bb.user_id = u.user_id
     JOIN books b ON bb.book_id = b.book_id`,
    (err, results) => {
      if (err) {
        console.error('Error fetching borrowed books:', err);
        return res.status(500).send('Error fetching borrowed books');
      }
      res.json(results);
    }
  );
});

// Route: Return a Book
app.post('/api/return-book', verifyToken, (req, res) => {
  const { borrowId } = req.body;

  if (!borrowId) {
    return res.status(400).send('Borrow ID is required');
  }

  // Fetch the book_id using only borrowId
  db.query(
    'SELECT book_id FROM borrowed_books WHERE borrow_id = ?',
    [borrowId],
    (err, results) => {
      if (err || results.length === 0) {
        console.error('Error fetching borrow record:', err || 'No record found');
        return res.status(404).send('No borrow record found for the given ID');
      }

      const bookId = results[0].book_id;

      // Delete the borrow record
      db.query('DELETE FROM borrowed_books WHERE borrow_id = ?', [borrowId], (err) => {
        if (err) {
          console.error('Error deleting borrow record:', err);
          return res.status(500).send('Error returning book');
        }

        // Increment the stock for the returned book
        db.query('UPDATE books SET stock = stock + 1 WHERE book_id = ?', [bookId], (err) => {
          if (err) {
            console.error('Error updating book stock:', err);
            return res.status(500).send('Error updating book stock');
          }

          res.status(200).send('Book returned successfully');
        });
      });
    }
  );
});

app.listen(port, '192.168.1.190', () => {
  console.log(`Server is running on http://192.168.1.190:${port}`);
});
