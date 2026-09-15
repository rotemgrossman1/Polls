import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import PageLayout from './PageLayout';
import Alert from './Alert';

function renderLayout(props) {
  return render(
    <MemoryRouter>
      <PageLayout {...props} />
    </MemoryRouter>,
  );
}

describe('PageLayout and NavBar', () => {
  test('renders one main region and a logo link named Polls to the landing page', () => {
    renderLayout({ children: <h1>Welcome</h1> });

    expect(screen.getAllByRole('main')).toHaveLength(1);
    const logo = screen.getByRole('link', { name: 'Polls' });
    expect(logo).toHaveAttribute('href', '/');
  });

  test('places the bottom bar after the main content', () => {
    renderLayout({
      children: <h1>Create a poll</h1>,
      bottomBar: <button type="button">Create poll</button>,
    });

    const main = screen.getByRole('main');
    const button = screen.getByRole('button', { name: 'Create poll' });
    expect(main).not.toContainElement(button);
    // eslint-disable-next-line no-bitwise
    expect(main.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('Alert', () => {
  test('announces its message', () => {
    render(<Alert>Couldn't create your poll. Check your connection and try again.</Alert>);

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't create your poll. Check your connection and try again.",
    );
  });
});
