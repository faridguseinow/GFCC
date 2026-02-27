import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light-theme'
  );

  // Единая точка управления классами
  useEffect(() => {
    const body = document.body;

    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(theme);

    localStorage.setItem('theme', theme);
  }, [theme]);

  // Если вдруг понадобится вручную
  const toggleTheme = () => {
    setTheme(prev =>
      prev === 'light-theme' ? 'dark-theme' : 'light-theme'
    );
  };

  return { theme, setTheme, toggleTheme };
}
