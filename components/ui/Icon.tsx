const paths = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  chat: 'M4 5h16v11H8l-4 4z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0',
  engine: 'M4 6h16M4 12h10M4 18h7M18 15l3 3-3 3',
  check: 'M5 12.5 10 17 19 7',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  plane: 'M2 13l8-2 5-7h2l-3 7 5 1 2-2h1l-1 4 1 4h-1l-2-2-5 1 3 7h-2l-5-7-8-2z',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  close: 'M6 6l12 12M18 6 6 18',
  chevron: 'M9 6l6 6-6 6',
  reset: 'M4 4v6h6M20 12a8 8 0 0 1-14.9 4M4 12a8 8 0 0 1 14.9-4',
  pause: 'M9 5v14M15 5v14',
  play: 'M7 5v14l12-7z',
  card: 'M3 6h18v12H3zM3 10h18',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}
