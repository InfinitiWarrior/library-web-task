import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BookList({ token }) {
  const [books, setBooks] = useState([]);
  const [borrowCooldowns, setBorrowCooldowns] = useState({});

  useEffect(() => {
    axios
      .get('http://192.168.1.190:5000/api/books', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setBooks(response.data))
      .catch((error) => console.error('Error fetching books:', error));
  }, [token]);

  const handleBorrow = (bookId) => {
    if (borrowCooldowns[bookId]) {
      alert(`Please wait ${borrowCooldowns[bookId]} seconds before borrowing again.`);
      return;
    }

    axios
      .post(
        'http://192.168.1.190:5000/api/borrow-book',
        { bookId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        // Update book stock locally
        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book.book_id === bookId ? { ...book, stock: book.stock - 1 } : book
          )
        );

        // Start a cooldown timer for this borrow action
        setBorrowCooldowns((prevCooldowns) => ({
          ...prevCooldowns,
          [bookId]: 60, // Cooldown duration in seconds
        }));

        const countdown = setInterval(() => {
          setBorrowCooldowns((prevCooldowns) => {
            const updatedCooldowns = { ...prevCooldowns };
            if (updatedCooldowns[bookId] > 1) {
              updatedCooldowns[bookId] -= 1;
            } else {
              clearInterval(countdown);
              delete updatedCooldowns[bookId];
            }
            return updatedCooldowns;
          });
        }, 1000);
      })
      .catch((error) => {
        console.error('Error borrowing book:', error);
        alert('Could not borrow this book. Please try again.');
      });
  };

  return (
    <div>
      <h2>Available Books</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        {books.map((book) => (
          <div
            key={book.book_id}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3>{book.title}</h3>
            <p><strong>Author:</strong> {book.author}</p>
            <p><strong>Genre:</strong> {book.genre}</p>
            <p>
              <strong>Stock:</strong>{' '}
              {book.stock > 0 ? book.stock : 'Out of Stock'}
            </p>
            <button
              onClick={() => handleBorrow(book.book_id)}
              disabled={book.stock === 0 || borrowCooldowns[book.book_id]}
              style={{
                backgroundColor:
                  book.stock === 0 || borrowCooldowns[book.book_id]
                    ? 'gray'
                    : '#007bff',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: book.stock === 0 || borrowCooldowns[book.book_id]
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {borrowCooldowns[book.book_id]
                ? `Cooldown (${borrowCooldowns[book.book_id]}s)`
                : book.stock > 0
                ? 'Borrow'
                : 'Unavailable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookList;
