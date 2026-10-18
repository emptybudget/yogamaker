// lucide 스타일 인라인 아이콘 (외부 의존성 없음)
const paths = {
  plus: 'M12 5v14M5 12h14',
  back: 'M15 18l-6-6 6-6',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  play: 'M7 4l13 8-13 8z',
  pause: 'M7 4h3v16H7zM14 4h3v16h-3z',
  next: 'M5 4l10 8-10 8zM19 5v14',
  prev: 'M19 20L9 12l10-8zM5 19V5',
  share: 'M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
  more: 'M12 6h.01M12 12h.01M12 18h.01',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  x: 'M18 6L6 18M6 6l12 12',
  settings: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
  layers: 'M12 2l10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3',
  check: 'M20 6L9 17l-5-5',
  up: 'M18 15l-6-6-6 6',
  down: 'M6 9l6 6 6-6',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  book: 'M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5zM4 19.5A2.5 2.5 0 006.5 22H20v-5',
  upload: 'M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2M7 9l5-5 5 5M12 4v12',
  download: 'M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2M7 11l5 5 5-5M12 4v12',
  bolt: 'M13 2L3 14h9l-1 8 10-12h-9z',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  const filled = name === 'play' || name === 'pause' || name === 'next' || name === 'prev';
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={name === 'grip' || name === 'more' ? 3 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[name]} />
    </svg>
  );
}
