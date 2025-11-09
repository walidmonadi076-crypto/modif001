import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Ad, SiteSettings } from '../types';

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

// --- SETTINGS CONTEXT ---

const defaultSettings: SiteSettings = {
  site_name: 'G2gaming',
  site_icon_url: '/favicon.ico',
  ogads_script_src: '',
  hero_title: 'Welcome to<br />G2gaming',
  hero_subtitle: 'Your ultimate gaming destination.',
  hero_button_text: 'Explore Games',
  hero_button_url: '/games',
  hero_bg_url: 'https://picsum.photos/seed/banner/1200/400',
  promo_enabled: true,
  promo_text: 'Climb the new G2gaming leaderboards',
  promo_button_text: 'Explore games',
  promo_button_url: '/games',
};

interface SettingsContextType {
  settings: SiteSettings;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
});

export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
  children: ReactNode;
  value: SiteSettings;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children, value }) => {
  return (
    <SettingsContext.Provider value={{ settings: value || defaultSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};