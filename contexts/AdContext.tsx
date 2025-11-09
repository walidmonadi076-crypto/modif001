
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Ad } from '../types';

// --- AD CONTEXT ---

interface AdContextType {
  ads: Ad[];
  isLoading: boolean;
}

const AdContext = createContext<AdContextType>({
  ads: [],
  isLoading: true,
});

export const useAds = () => useContext(AdContext);

export const AdProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/ads');
        if (res.ok) {
          const data = await res.json();
          setAds(data);
        }
      } catch (error) {
        console.error('Failed to fetch ads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAds();
  }, []);

  return (
    <AdContext.Provider value={{ ads, isLoading }}>
      {children}
    </AdContext.Provider>
  );
};

// --- THEME CONTEXT ---

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // On component mount, sync state with the class set by the script in _document.tsx
    const currentTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    setTheme(currentTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
      return newTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
