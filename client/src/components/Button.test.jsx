import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  test('renders a native button of type button that handles clicks', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Create poll</Button>);

    const button = screen.getByRole('button', { name: 'Create poll' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('loading shows a hidden spinner, keeps the label, stays focusable, and ignores presses', async () => {
    const onClick = jest.fn();
    render(
      <Button loading onClick={onClick}>
        Creating…
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Creating…' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(screen.getByTestId('button-spinner')).toHaveAttribute('aria-hidden', 'true');

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    button.focus();
    expect(button).toHaveFocus();
  });

  test('a loading submit button does not submit its form', async () => {
    const onSubmit = jest.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Creating…
        </Button>
      </form>,
    );

    await userEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('unavailable is announced with its reason and ignores presses', async () => {
    const onClick = jest.fn();
    render(
      <>
        <Button variant="secondary-dashed" unavailable aria-describedby="hint" onClick={onClick}>
          Add option
        </Button>
        <p id="hint">You can add up to 8 options.</p>
      </>,
    );

    const button = screen.getByRole('button', { name: 'Add option' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAccessibleDescription('You can add up to 8 options.');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('disabled uses the native attribute', () => {
    render(<Button disabled>Cancel</Button>);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  test('an icon is decorative and does not change the accessible name', () => {
    const { container } = render(<Button icon="plus">Create poll</Button>);

    expect(screen.getByRole('button', { name: 'Create poll' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  test('success shows the success fill and a check icon in place of its icon, and stays usable', async () => {
    const onClick = jest.fn();
    const { container } = render(
      <Button icon="copy" success onClick={onClick}>
        Copied
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Copied' });
    expect(button).toHaveClass('bg-success', 'text-text-inverse');
    expect(button).not.toHaveAttribute('aria-disabled');
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelector('svg')).toHaveAttribute('data-icon', 'check');

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('without success, the button keeps its own icon and variant', () => {
    const { container } = render(<Button icon="copy">Copy</Button>);

    expect(screen.getByRole('button', { name: 'Copy' })).toHaveClass('bg-action');
    expect(container.querySelector('svg')).toHaveAttribute('data-icon', 'copy');
  });

  test('loading wins over success', () => {
    render(
      <Button loading success>
        Joining…
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Joining…' });
    expect(button).not.toHaveClass('bg-success');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});
