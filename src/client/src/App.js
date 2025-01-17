import React, { useState, useEffect } from 'react';
import './App.css';
import DarkModeToggle from './components/DarkModeToggle';
import Login from './components/Login';
import BookList from './components/BookList';
import BorrowedBooks from './components/BorrowedBooks';
import { Routes, Route, Link } from 'react-router-dom';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [loggedInAs, setLoggedInAs] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedLoggedInAs = localStorage.getItem('loggedInAs');
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';

    if (storedToken && storedLoggedInAs) {
      setLoggedIn(true);
      setToken(storedToken);
      setLoggedInAs(storedLoggedInAs);
    }
    setDarkMode(storedDarkMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  const handleLogout = () => {
    setLoggedIn(false);
    setToken('');
    setLoggedInAs('');
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInAs');
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <header className="header">
        <h1>Library Management</h1>
        <nav className="navbar">
          <Link to="/">Home</Link>
          {loggedIn && <Link to="/booklist">Book List</Link>}
          {loggedIn && <Link to="/borrowedbooks">Borrowed Books</Link>}
          <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          {loggedIn && <button onClick={handleLogout}>Logout</button>}
        </nav>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            loggedIn ? (
              <div className="homepage">
                <h2>Welcome, {loggedInAs}!</h2>
                <div>
                  <Link to="/booklist">
                    <button>Go to Book List</button>
                  </Link>
                  <Link to="/borrowedbooks">
                    <button>Go to Borrowed Books</button>
                  </Link>
                </div>
              </div>
            ) : (
              <Login setLoggedIn={setLoggedIn} setToken={setToken} setLoggedInAs={setLoggedInAs} />
            )
          }
        />
        <Route
          path="/booklist"
          element={loggedIn ? <BookList token={token} /> : <Login setLoggedIn={setLoggedIn} setToken={setToken} setLoggedInAs={setLoggedInAs} />}
        />
        <Route
          path="/borrowedbooks"
          element={loggedIn ? <BorrowedBooks token={token} /> : <p>Access denied.</p>}
        />
      </Routes>
    </div>
  );
}

export default App;
