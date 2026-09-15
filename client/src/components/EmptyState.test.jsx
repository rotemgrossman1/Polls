import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

const HEADING = "This link doesn't work";
const BODY = 'It may be mistyped or incomplete. Ask the person who shared it for a new link.';

describe('EmptyState', () => {
  test('shows the heading as the page h1, the body, and a decorative tilted icon in a dashed circle', () => {
    render(<EmptyState icon="brokenLink" heading={HEADING} body={BODY} />);

    expect(screen.getByRole('heading', { level: 1, name: HEADING })).toBeInTheDocument();
    expect(screen.getByText(BODY)).toBeInTheDocument();
    const icon = screen.getByTestId('empty-state-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveClass('border-dashed', 'rotate-tilt-md');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('uses an h2 when it does not fill the screen, and shows an action when given one', () => {
    render(
      <EmptyState
        icon="list"
        heading="No polls yet"
        body="Create one."
        headingLevel={2}
        action={<button type="button">Create poll</button>}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'No polls yet' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create poll' })).toBeInTheDocument();
  });
});
