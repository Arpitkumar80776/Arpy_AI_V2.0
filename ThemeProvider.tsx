import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type NeonTheme = 'blue' | 'violet' | 'green';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  neonTheme: NeonTheme;
  setNeonTheme: (theme: NeonTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [neonTheme, setNeonTheme] = useState<NeonTheme>('blue');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedNeonTheme = localStorage.getItem('neonTheme') as NeonTheme;
    
    if (savedTheme) setTheme(savedTheme);
    if (savedNeonTheme) setNeonTheme(savedNeonTheme);
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', neonTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('neonTheme', neonTheme);
  }, [theme, neonTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, neonTheme, setNeonTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
