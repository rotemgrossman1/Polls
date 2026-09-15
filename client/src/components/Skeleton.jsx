// Placeholder shape shown while content loads (catalog: Skeleton). Always decorative:
// the page shows the spec's loading text next to it.
const SHAPES = {
  line: 'h-4 rounded-full',
  title: 'h-7 rounded-full',
  row: 'h-10 rounded-md',
  // Matches StickerHeading; the tilt is static, so it stays under reduced motion.
  sticker: 'h-10 rounded-full rotate-tilt-sm',
};

const WIDTHS = {
  full: 'w-full',
  '3/4': 'w-3/4',
  '1/2': 'w-1/2',
  '2/5': 'w-2/5',
};

export default function Skeleton({ variant = 'line', width = 'full' }) {
  return (
    <span
      aria-hidden="true"
      data-testid="skeleton"
      data-shape={variant}
      className={`block bg-chart-track animate-skeleton-pulse motion-reduce:animate-none ${SHAPES[variant]} ${WIDTHS[width]}`}
    />
  );
}
