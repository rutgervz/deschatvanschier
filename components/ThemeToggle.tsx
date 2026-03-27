'use client';

import { useTheme } from './ThemeProvider';

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const AutoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/>
  </svg>
);

export default function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  const cycle = () => {
    const next = preference === 'auto' ? 'light' : preference === 'light' ? 'dark' : 'auto';
    setPreference(next);
  };

  const labels = { auto: 'Auto', light: 'Dag', dark: 'Nacht' };
  const icons = { auto: <AutoIcon />, light: <SunIcon />, dark: <MoonIcon /> };

  return (
    <button
      onClick={cycle}
      title={`Thema: ${labels[preference]}. Klik om te wisselen.`}
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '6px 12px',
        borderRadius: 20,
        border: '1px solid var(--border)',
        background: 'var(--wh)',
        color: 'var(--ink-m)',
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "'Outfit', sans-serif",
        cursor: 'pointer',
        transition: 'all 0.2s',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {icons[preference]}
      {labels[preference]}
    </button>
  );
}
