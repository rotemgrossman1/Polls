import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';

// Form-level or page-level failure message (catalog: Alert, danger variant).
export default function Alert({ children }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md border border-danger bg-danger-subtle px-4 py-3"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0 text-danger"
      >
        <path d={ICON_PATHS.alert} />
      </svg>
      <p className="min-w-0 font-medium text-text">{children}</p>
    </div>
  );
}
