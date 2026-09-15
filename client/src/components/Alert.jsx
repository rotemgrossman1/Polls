import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';

/**
 * Form-level or page-level failure message (catalog: Alert, danger variant).
 * Either `children` (one message) or `title` + `body` (when the spec gives a heading and a body).
 * `as` sets the message or title element, e.g. "h1" when it is the screen's heading.
 */
export default function Alert({ children, title, body, as: TextElement = 'p' }) {
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
      {title ? (
        <div className="flex min-w-0 flex-col">
          <TextElement className="break-words text-base font-bold leading-normal text-text">{title}</TextElement>
          {body && <p className="break-words text-base font-regular text-text">{body}</p>}
        </div>
      ) : (
        <TextElement className="min-w-0 text-base font-medium text-text">{children}</TextElement>
      )}
    </div>
  );
}
