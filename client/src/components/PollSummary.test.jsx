import { render, screen, within } from '@testing-library/react';
import PollSummary from './PollSummary';
import StatusBadge from './StatusBadge';
import SuccessMark from './SuccessMark';
import Skeleton from './Skeleton';

function poll(overrides = {}) {
  return {
    id: 'poll-1',
    question: 'Where should we hold the Q4 team offsite?',
    details: null,
    answerType: 'single',
    status: 'open',
    createdAt: '2026-09-15T08:00:00.000Z',
    options: [
      { id: 'o1', text: 'Tel Aviv — beach hotel', position: 0 },
      { id: 'o2', text: 'Jerusalem', position: 1 },
      { id: 'o3', text: 'Haifa', position: 2 },
    ],
    ...overrides,
  };
}

describe('PollSummary', () => {
  test('is an article labelled by the question, with status, answer type, and options in order', () => {
    render(<PollSummary poll={poll()} />);

    const article = screen.getByRole('article', { name: 'Where should we hold the Q4 team offsite?' });
    expect(within(article).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Where should we hold the Q4 team offsite?',
    );
    expect(within(article).getByText('Open')).toBeInTheDocument();
    expect(within(article).getByText('Single choice')).toBeInTheDocument();
    const items = within(article).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      '1Tel Aviv — beach hotel',
      '2Jerusalem',
      '3Haifa',
    ]);
  });

  test('single choice uses a dot-in-circle icon, and a divider separates the options from the content above', () => {
    const { container, rerender } = render(<PollSummary poll={poll()} />);
    const iconPaths = () => container.querySelectorAll('[data-testid="answer-type-icon"] path');

    expect(iconPaths()).toHaveLength(2);
    expect(iconPaths()[1]).toHaveAttribute('fill', 'currentColor');
    expect(screen.getByRole('list')).toHaveClass('border-t-2', 'border-border');

    rerender(<PollSummary poll={poll({ answerType: 'multiple' })} />);
    expect(iconPaths()).toHaveLength(1);
  });

  test('shows Multiple choice for multiple-answer polls', () => {
    render(<PollSummary poll={poll({ answerType: 'multiple' })} />);

    expect(screen.getByText('Multiple choice')).toBeInTheDocument();
  });

  test('shows details with line breaks kept, and nothing when there are none', () => {
    const { rerender } = render(<PollSummary poll={poll({ details: 'Budget is small.\nBring a jacket.' })} />);

    const details = screen.getByText(/Budget is small\./);
    expect(details.textContent).toBe('Budget is small.\nBring a jacket.');
    expect(details).toHaveClass('whitespace-pre-wrap');

    rerender(<PollSummary poll={poll({ details: null })} />);
    expect(screen.queryByText(/Budget is small\./)).not.toBeInTheDocument();
  });

  test('renders markup and script as plain text', () => {
    const { container } = render(
      <PollSummary
        poll={poll({
          question: '<script>alert(1)</script>',
          details: '<img src=x onerror=alert(1)>',
          options: [
            { id: 'o1', text: '<b>Yes</b>', position: 0 },
            { id: 'o2', text: 'No', position: 1 },
          ],
        })}
      />,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('<script>alert(1)</script>');
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(screen.getByText('<b>Yes</b>')).toBeInTheDocument();
    expect(container.querySelector('script, img, b')).toBeNull();
  });

  test('keeps right-to-left text and emoji as entered with automatic direction', () => {
    render(<PollSummary poll={poll({ question: 'לאן נצא בחמישי? 🍕' })} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('לאן נצא בחמישי? 🍕');
    expect(heading).toHaveAttribute('dir', 'auto');
  });
});

describe('StatusBadge', () => {
  test('reads the spec copy with a decorative marker', () => {
    const { container } = render(<StatusBadge status="open" />);

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('SuccessMark and Skeleton', () => {
  test('are hidden from screen readers', () => {
    render(
      <>
        <SuccessMark />
        <Skeleton variant="title" width="3/4" />
      </>,
    );

    expect(screen.getByTestId('success-mark')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true');
  });
});
