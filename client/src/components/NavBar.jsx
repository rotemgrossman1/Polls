import { Link } from 'react-router';
import { COPY } from '../utils/uiCopy';
import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';
import { ROUTES } from '../utils/routes';

// Top bar with the logo link. The current user is added by Register and log in.
export default function NavBar() {
  return (
    <header className="px-5 py-3">
      <nav className="mx-auto flex w-full max-w-container items-center gap-3">
        <Link
          to={ROUTES.home}
          className="inline-flex min-h-touch items-center gap-3 rounded-md text-xl font-bold leading-tight text-text focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-md bg-action text-action-text rotate-tilt-md"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={ICON_STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d={ICON_PATHS.bars} />
            </svg>
          </span>
          {COPY.app.name}
        </Link>
      </nav>
    </header>
  );
}
