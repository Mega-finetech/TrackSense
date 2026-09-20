import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('tracksense-dark-mode');
    if (savedTheme !== null) {
      const isDark = JSON.parse(savedTheme);
      setIsDarkMode(isDark);
      applyTheme(isDark);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      applyTheme(prefersDark);
    }
    setIsLoading(false);
  }, []);

  const applyTheme = (isDark) => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const toggleDarkMode = async (newValue) => {
    setIsDarkMode(newValue);
    localStorage.setItem('tracksense-dark-mode', JSON.stringify(newValue));
    applyTheme(newValue);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
