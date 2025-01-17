import React, { useState } from 'react';

function DarkModeToggle({ setDarkMode, darkMode }) {
  return (
    <button 
      className="dark-mode-toggle" 
      onClick={() => setDarkMode(!darkMode)}
    >
      {darkMode ? '🌙' : '🌞'}
    </button>
  );
}

export default DarkModeToggle;
