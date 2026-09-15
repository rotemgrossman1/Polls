import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-sans font-bold leading-tight ' +
  // Colors ease with --ease-standard; only the press uses --ease-emphasized (brief: Motion).
  'transition duration-fast ease-standard active:ease-emphasized motion-reduce:transition-none ' +
  'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';

const SIZES = {
  default: 'min-h-12 px-6 text-base',
  sm: 'min-h-touch px-4 text-sm',
};

const PRESS = 'active:translate-y-press active:shadow-none motion-reduce:active:translate-y-0';

const VARIANTS = {
  primary: `bg-action text-action-text shadow-md hover:bg-action-hover ${PRESS}`,
  secondary: `border border-text bg-surface text-text hover:bg-bg ${PRESS}`,
  'secondary-dashed': `border border-dashed border-text bg-surface text-text hover:bg-bg ${PRESS}`,
  ghost: `bg-transparent text-text hover:bg-action-subtle ${PRESS}`,
  danger: `border border-transparent bg-danger text-text-inverse shadow-md hover:border-text ${PRESS}`,
};

const LOADING = {
  primary: 'bg-action-hover text-action-text shadow-none cursor-progress',
  secondary: 'border border-text bg-surface text-text cursor-progress',
  'secondary-dashed': 'border border-dashed border-text bg-surface text-text cursor-progress',
  ghost: 'bg-transparent text-text cursor-progress',
  danger: 'border border-transparent bg-danger text-text-inverse shadow-none cursor-progress',
};

const DISABLED = 'border border-border-strong bg-surface text-text-muted shadow-none cursor-not-allowed';

const WIDTHS = {
  true: 'w-full',
  mobile: 'w-full md:w-auto',
};

/**
 * Pill button from the catalog.
 * - `loading`: spinner + label, aria-disabled so focus stays, presses ignored.
 * - `unavailable`: aria-disabled but focusable (pair with aria-describedby for the reason).
 * - `disabled`: native disabled.
 * - `block`: true for full width, 'mobile' for full width below md.
 * - `icon`: key of ICON_PATHS shown before the label.
 */
export default function Button({
  variant = 'primary',
  size = 'default',
  block = false,
  loading = false,
  unavailable = false,
  disabled = false,
  icon,
  type = 'button',
  onClick,
  children,
  ...rest
}) {
  const inert = loading || unavailable;

  let stateClasses = VARIANTS[variant];
  if (loading) {
    stateClasses = LOADING[variant];
  } else if (unavailable || disabled) {
    stateClasses = DISABLED;
  }

  function handleClick(event) {
    if (inert) {
      event.preventDefault();
      return;
    }
    if (onClick) {
      onClick(event);
    }
  }

  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={inert ? 'true' : undefined}
      onClick={handleClick}
      className={[BASE, SIZES[size], stateClasses, WIDTHS[block] || ''].join(' ')}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          data-testid="button-spinner"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-spin-slow"
        />
      )}
      {!loading && icon && (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={ICON_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 shrink-0"
        >
          <path d={ICON_PATHS[icon]} />
        </svg>
      )}
      {children}
    </button>
  );
}
