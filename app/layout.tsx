import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'De Schat van Schier — Mogelijkmaakdag',
  description: '35 plannen van de kinderen van Schiermonnikoog',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var pref = localStorage.getItem('schier-theme') || 'auto';
              var theme = pref;
              if (pref === 'auto') {
                var h = new Date().getHours();
                theme = (h >= 20 || h < 7) ? 'dark' : 'light';
              }
              document.documentElement.setAttribute('data-theme', theme);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>
        <ThemeProvider>
          <ThemeToggle />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
