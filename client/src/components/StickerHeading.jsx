import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';

/**
 * Tilted pill heading for a playful screen moment (catalog: StickerHeading). Rendered as the page
 * h1, sized to its text at the start of the column; the text wraps if it does not fit. The tilt is
 * static, so it stays under reduced motion.
 */
export default function StickerHeading({ icon = 'link', children }) {
  return (
    <h1 className="inline-flex max-w-full items-center gap-2 self-start rounded-full border border-text bg-surface px-4 py-2 text-lg font-bold leading-tight text-text shadow-sm rotate-tilt-sm">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0 text-action"
      >
        <path d={ICON_PATHS[icon]} />
      </svg>
      <span className="min-w-0 break-words">{children}</span>
    </h1>
  );
}
