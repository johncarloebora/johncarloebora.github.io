import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Carlo Ebora — Portfolio',
  description: 'Computer Engineer. Multidisciplinary Creative — Design, Data & Automation.',
  metadataBase: new URL('https://johncarloebora.github.io'),
  openGraph: {
    title: 'Carlo Ebora — Portfolio',
    description: 'Computer Engineer. Multidisciplinary Creative — Design, Data & Automation.',
    type: 'website',
  },
};

// Inline theme script prevents flash of wrong theme
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
