import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';

// Decorative success moment placed directly above a success heading (catalog: SuccessMark).
export default function SuccessMark() {
  return (
    <span
      aria-hidden="true"
      data-testid="success-mark"
      className="grid h-success-mark w-success-mark shrink-0 place-items-center rounded-full border border-success bg-success-subtle text-success rotate-tilt-sm"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-9 w-9"
      >
        <path d={ICON_PATHS.check} />
      </svg>
    </span>
  );
}
