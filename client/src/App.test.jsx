import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App';
import { getInvite } from './services/inviteService';

jest.mock('./services/inviteService', () => ({ getInvite: jest.fn(), joinPoll: jest.fn() }));

const INVITE = { question: 'Where should we eat on Friday?', details: null, status: 'open', optionCount: 3 };
const BROKEN_HEADING = "This link doesn't work";

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

const robotsMeta = () => document.head.querySelectorAll('meta[name="robots"][content="noindex"]');

describe('App routes', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('opens on the landing page', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome' })).toBeInTheDocument();
  });

  test('shows the Create poll form at /polls/new', () => {
    renderAt('/polls/new');

    expect(screen.getByRole('heading', { level: 1, name: 'Create a poll' })).toBeInTheDocument();
  });

  test('redirects unknown paths to the landing page', () => {
    renderAt('/nowhere');

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome' })).toBeInTheDocument();
  });

  test.each([
    ['an invite link', '/i/q7Kx2Wm9aZ'],
    ['an invite link with a trailing slash', '/i/q7Kx2Wm9aZ/'],
    ['an invite link with tracking parameters', '/i/q7Kx2Wm9aZ?utm_source=x&fbclid=abc'],
    ['an invite link with a fragment', '/i/q7Kx2Wm9aZ#section'],
  ])('%s opens the invite page for that code', async (label, path) => {
    getInvite.mockResolvedValue(INVITE);

    renderAt(path);

    expect(await screen.findByRole('heading', { level: 1, name: "You're invited" })).toBeInTheDocument();
    expect(getInvite).toHaveBeenCalledWith('q7Kx2Wm9aZ');
    expect(robotsMeta()).toHaveLength(1);
  });

  test.each([
    ['no code', '/i'],
    ['no code and a trailing slash', '/i/'],
    ['extra path segments', '/i/a/b'],
    ['a code followed by another segment', '/i/q7Kx2Wm9aZ/extra'],
  ])('an invite path with %s shows the link doesn\'t work page without loading anything', (label, path) => {
    renderAt(path);

    expect(screen.getByRole('heading', { level: 1, name: BROKEN_HEADING })).toBeInTheDocument();
    expect(
      screen.getByText('It may be mistyped or incomplete. Ask the person who shared it for a new link.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(getInvite).not.toHaveBeenCalled();
    expect(robotsMeta()).toHaveLength(1);
  });

  test('a code the API does not know shows the same page as a path with no code', async () => {
    getInvite.mockRejectedValue(Object.assign(new Error('Request failed with status 404'), { status: 404 }));
    const unknown = renderAt('/i/zzzzzzzzzz');
    await screen.findByRole('heading', { level: 1, name: BROKEN_HEADING });
    const unknownMarkup = unknown.container.innerHTML;
    unknown.unmount();

    const missing = renderAt('/i');

    expect(missing.container.innerHTML).toBe(unknownMarkup);
  });
});
