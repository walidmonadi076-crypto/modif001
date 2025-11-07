import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Met à jour la valeur "debounced" après le délai spécifié
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoie le minuteur si la valeur change (par exemple, nouvelle frappe)
    // ou si le composant est démonté.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
