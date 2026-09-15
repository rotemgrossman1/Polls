import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App routes', () => {
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
});
