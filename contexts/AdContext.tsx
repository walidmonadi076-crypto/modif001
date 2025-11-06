import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Ad } from '../types';

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