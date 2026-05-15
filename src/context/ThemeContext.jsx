import { createContext, useContext, useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme_premium') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    localStorage.setItem('theme_premium', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);

    // 🔥 Alert UI
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      icon: nextTheme ? 'success' : 'info',
      title: nextTheme
        ? 'Dark Mode Activated 🌙'
        : 'Light Mode Activated ☀️',
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
      background: nextTheme ? '#111827' : '#ffffff',
      color: nextTheme ? '#f9fafb' : '#111827',
      customClass: {
        popup: 'theme-alert',
      },
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}