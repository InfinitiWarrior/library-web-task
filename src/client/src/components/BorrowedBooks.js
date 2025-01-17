import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BorrowedBooks({ token }) {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [cooldowns, setCooldowns] = useState({});

  useEffect(() => {
    axios
      .get('http://192.168.1.190:5000/api/borrowed-books', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setBorrowedBooks(response.data))
      .catch((error) => console.error('Error fetching borrowed books:', error));
  }, [token]);

  const handleReturn = (borrowId, bookId) => {
    if (cooldowns[borrowId]) {
      alert(`Please wait ${cooldowns[borrowId]} seconds before returning again.`);
      return;
    }

    axios
      .post(
        'http://192.168.1.190:5000/api/return-book',
        { borrowId, bookId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        // Update borrowed books state to reflect the returned book
        setBorrowedBooks((prevBooks) =>
          prevBooks.filter((book) => book.borrow_id !== borrowId)
        );

        // Start a cooldown timer for this return action
        setCooldowns((prevCooldowns) => ({
          ...prevCooldowns,
          [borrowId]: 60, // Cooldown duration in seconds
        }));

        const countdown = setInterval(() => {
          setCooldowns((prevCooldowns) => {
            const updatedCooldowns = { ...prevCooldowns };
            if (updatedCooldowns[borrowId] > 1) {
              updatedCooldowns[borrowId] -= 1;
            } else {
              clearInterval(countdown);
              delete updatedCooldowns[borrowId];
            }
            return updatedCooldowns;
          });
        }, 1000);
      })
      .catch((error) => {
        console.error('Error returning book:', error);
        alert('Could not return this book. Please try again.');
      });
  };

  return (
    <div>
      <h2>Borrowed Books</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        {borrowedBooks.map((book) => (
          <div
            key={book.borrow_id}
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
            <p><strong>Borrowed by:</strong> {book.full_name}</p>
            <p><strong>Borrow Date:</strong> {new Date(book.borrow_date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> {new Date(book.due_date).toLocaleDateString()}</p>
            <button
              onClick={() => handleReturn(book.borrow_id, book.book_id)}
              disabled={cooldowns[book.borrow_id]}
              style={{
                backgroundColor:
                  cooldowns[book.borrow_id] ? 'gray' : '#28a745',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: cooldowns[book.borrow_id] ? 'not-allowed' : 'pointer',
              }}
            >
              {cooldowns[book.borrow_id]
                ? `Cooldown (${cooldowns[book.borrow_id]}s)`
                : 'Return'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BorrowedBooks;
