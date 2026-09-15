import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';

/**
 * Whole-content message when there is nothing to show (catalog: EmptyState): a large tilted icon
 * in a dashed circle, a heading, a body and an optional action (a primary Button).
 * - `headingLevel`: 1 when the empty state fills the screen, otherwise 2.
 */
export default function EmptyState({ icon, heading, body, headingLevel = 1, action = null }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <span
        aria-hidden="true"
        data-testid="empty-state-icon"
        className="grid h-empty-state-icon w-empty-state-icon shrink-0 place-items-center rounded-full border border-dashed border-action bg-action-subtle text-action rotate-tilt-md"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={ICON_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10"
        >
          <path d={ICON_PATHS[icon]} />
        </svg>
      </span>
      <Heading className="max-w-full break-words text-2xl font-bold leading-tight text-text">{heading}</Heading>
      <p className="max-w-full break-words text-base text-text-muted">{body}</p>
      {action}
    </div>
  );
}
