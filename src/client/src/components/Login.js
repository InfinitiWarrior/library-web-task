import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login({ setLoggedIn, setToken, setLoggedInAs }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://192.168.1.190:5000/api/login', { username, password });

      if (response.status === 200) {
        const { token, role } = response.data;
        setLoggedIn(true);
        setLoggedInAs(username);
        setToken(token);
        localStorage.setItem('loggedInAs', username);
        localStorage.setItem('token', token);

        navigate(role === 'staff' ? '/borrowedbooks' : '/booklist');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>

      {error && <p>{error}</p>}
    </div>
  );
}

export default Login;
