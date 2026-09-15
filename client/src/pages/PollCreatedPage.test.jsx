import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import PollCreatedPage from './PollCreatedPage';
import { getPoll } from '../services/pollService';

jest.mock('../services/pollService', () => ({ getPoll: jest.fn() }));

const POLL = {
  id: 'poll-1',
  question: 'Where should we eat on Friday?',
  details: 'Team lunch.\nBudget is small.',
  answerType: 'multiple',
  status: 'open',
  createdAt: '2026-09-15T08:00:00.000Z',
  options: [
    { id: 'o1', text: 'Sushi', position: 0 },
    { id: 'o2', text: 'Pizza', position: 1 },
  ],
};

let currentLocation;
function LocationProbe() {
  currentLocation = useLocation();
  return null;
}

function renderPage(entry) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocationProbe />
      <Routes>
        <Route path="/" element={<p>Landing page</p>} />
        <Route path="/polls/new" element={<p>Empty Create poll form</p>} />
        <Route path="/polls/:pollId/created" element={<PollCreatedPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const afterCreate = () => ({ pathname: '/polls/poll-1/created', state: { poll: POLL } });

describe('PollCreatedPage', () => {
  test('right after creating, shows the confirmation for the handed-over poll without loading', () => {
    renderPage(afterCreate());

    expect(screen.getByRole('heading', { level: 1, name: 'Poll created' })).toBeInTheDocument();
    expect(screen.getByText('Your poll is open and ready for answers.')).toBeInTheDocument();
    const summary = screen.getByRole('article', { name: 'Where should we eat on Friday?' });
    expect(within(summary).getByText('Open')).toBeInTheDocument();
    expect(within(summary).getByText('Multiple choice')).toBeInTheDocument();
    expect(within(summary).getByText(/Budget is small/)).toBeInTheDocument();
    expect(within(summary).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '1Sushi',
      '2Pizza',
    ]);
    expect(screen.getByRole('button', { name: 'Back to home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create another poll' })).toBeInTheDocument();
    expect(getPoll).not.toHaveBeenCalled();
  });

  test('clears the handed-over poll from history so a reload loads it again', () => {
    renderPage(afterCreate());

    expect(currentLocation.pathname).toBe('/polls/poll-1/created');
    expect(currentLocation.state).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Poll created' })).toBeInTheDocument();
  });

  test('on reload shows "Loading poll…" and then the same poll', async () => {
    getPoll.mockResolvedValue(POLL);
    renderPage('/polls/poll-1/created');

    expect(screen.getByRole('status')).toHaveTextContent('Loading poll…');
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();

    expect(await screen.findByRole('heading', { level: 1, name: 'Poll created' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Where should we eat on Friday?' })).toBeInTheDocument();
    expect(getPoll).toHaveBeenCalledWith('poll-1');
    expect(screen.queryByText('Loading poll…')).not.toBeInTheDocument();
  });

  test.each([
    ['a poll that does not exist or belongs to someone else', { status: 404 }],
    ['a network failure', { status: null }],
  ])('%s shows the load error with Back to home', async (label, failure) => {
    getPoll.mockRejectedValue(Object.assign(new Error('Request failed'), failure));
    renderPage('/polls/unknown/created');

    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load this poll.");
    expect(screen.queryByRole('heading', { name: 'Poll created' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back to home' }));
    expect(screen.getByText('Landing page')).toBeInTheDocument();
  });

  test('Back to home opens the landing page', async () => {
    renderPage(afterCreate());

    await userEvent.click(screen.getByRole('button', { name: 'Back to home' }));

    expect(screen.getByText('Landing page')).toBeInTheDocument();
  });

  test('Create another poll opens an empty form', async () => {
    renderPage(afterCreate());

    await userEvent.click(screen.getByRole('button', { name: 'Create another poll' }));

    expect(screen.getByText('Empty Create poll form')).toBeInTheDocument();
  });
});
