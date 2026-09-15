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

describe('NavBar variants', () => {
  test('navVariant="minimal" shows only the logo link', () => {
    const { container } = renderLayout({ children: <h1>You're invited</h1>, navVariant: 'minimal' });

    const header = container.querySelector('header');
    expect(header).toHaveAttribute('data-variant', 'minimal');
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName('Polls');
    expect(links[0]).toHaveAttribute('href', '/');
  });

  test('the default variant is used when navVariant is not given', () => {
    const { container } = renderLayout({ children: <h1>Welcome</h1> });

    expect(container.querySelector('header')).toHaveAttribute('data-variant', 'default');
  });
});

describe('Alert', () => {
  test('announces its message', () => {
    render(<Alert>Couldn't create your poll. Check your connection and try again.</Alert>);

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't create your poll. Check your connection and try again.",
    );
  });

  test('shows a title and a body, with the title as the given element', () => {
    render(
      <Alert as="h1" title="We couldn't load this poll." body="Check your connection and try again." />,
    );

    const alert = screen.getByRole('alert');
    const heading = screen.getByRole('heading', { level: 1, name: "We couldn't load this poll." });
    expect(alert).toContainElement(heading);
    expect(alert).toHaveTextContent("We couldn't load this poll.Check your connection and try again.");
    expect(screen.getByText('Check your connection and try again.').tagName).toBe('P');
  });

  test('the icon is decorative', () => {
    const { container } = render(<Alert title="We couldn't load this poll." body="Check your connection and try again." />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
