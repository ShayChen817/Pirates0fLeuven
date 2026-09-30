import type { Metadata, Viewport } from 'next';
// Self-hosted via npm so builds never depend on reaching Google Fonts.
import '@fontsource-variable/albert-sans';
import './globals.css';

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
    <html lang="en">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
