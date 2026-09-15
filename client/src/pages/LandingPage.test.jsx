import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import LandingPage from './LandingPage';

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/polls/new" element={<p>Create poll form</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  test('shows the heading, intro, and Create poll button', () => {
    renderLanding();

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome' })).toBeInTheDocument();
    expect(screen.getByText('Create a poll and share it with others.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create poll' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  test('the decorative bars are hidden from screen readers', () => {
    renderLanding();

    const bars = screen.getByTestId('hero-bars');
    expect(bars).toHaveAttribute('aria-hidden', 'true');
    // Long, decreasing bars with a space-2 gap, as in the preview.
    expect(bars).toHaveClass('w-2/3', 'gap-2');
    expect(Array.from(bars.children).map((bar) => bar.className.match(/w-\S+/)[0])).toEqual([
      'w-full',
      'w-3/5',
      'w-1/3',
    ]);
  });

  test('Create poll opens the Create poll form', async () => {
    renderLanding();

    await userEvent.click(screen.getByRole('button', { name: 'Create poll' }));

    expect(screen.getByText('Create poll form')).toBeInTheDocument();
  });
});
