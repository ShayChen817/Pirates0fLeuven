import type { Metadata, Viewport } from 'next';
import { Albert_Sans } from 'next/font/google';
import './globals.css';

const albert = Albert_Sans({ subsets: ['latin'], variable: '--font-albert', display: 'swap' });

export const metadata: Metadata = {
  title: 'Life Goals with Kate — Pirates0fLeuven',
  description: 'KBC-inspired hackathon prototype. Synthetic data only; not affiliated with KBC.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d2a50',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={albert.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
