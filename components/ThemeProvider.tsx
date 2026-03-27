'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

type Theme = 'light' | 'dark';
type ThemePreference = 'auto' | 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}>({ theme: 'light', preference: 'auto', setPreference: () => {} });

export function useTheme() { return useContext(ThemeContext); }

function getAutoTheme(): Theme {
  const hour = new Date().getHours();
  // Schiermonnikoog: sunset ~20:00 in summer, ~17:00 in winter
  // Simplified: dark between 20:00 and 07:00
  return (hour >= 20 || hour < 7) ? 'dark' : 'light';
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('auto');
  const [theme, setTheme] = useState<Theme>('light');

  const applyTheme = useCallback((pref: ThemePreference) => {
    const t = pref === 'auto' ? getAutoTheme() : pref;
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    localStorage.setItem('schier-theme', p);
    applyTheme(p);
  }, [applyTheme]);

  useEffect(() => {
    const saved = localStorage.getItem('schier-theme') as ThemePreference | null;
    const pref = saved || 'auto';
    setPreferenceState(pref);
    applyTheme(pref);

    // Re-check auto theme every minute
    const interval = setInterval(() => {
      const current = localStorage.getItem('schier-theme') as ThemePreference | null;
      if (!current || current === 'auto') {
        applyTheme('auto');
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}
