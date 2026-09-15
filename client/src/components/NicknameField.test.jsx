import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NicknameField from './NicknameField';

function Form({ onSubmit = jest.fn((event) => event.preventDefault()), initialValue = '', ...props }) {
  const [value, setValue] = useState(initialValue);
  return (
    <form noValidate onSubmit={onSubmit}>
      <NicknameField id="nickname" value={value} onChange={setValue} {...props} />
    </form>
  );
}

const field = () => screen.getByLabelText('Your nickname');

describe('NicknameField', () => {
  test('shows the label, placeholder, help text and counter from the spec', () => {
    render(<Form />);

    expect(field()).toHaveAttribute('placeholder', 'e.g. Noa');
    expect(screen.getByText("The poll's creator will see this name.")).toBeInTheDocument();
    expect(screen.getByText('0/20')).toBeInTheDocument();
    expect(field()).toHaveValue('');
  });

  test('has the nickname autocomplete, automatic direction, a go key, and a 20-character limit', () => {
    render(<Form />);

    expect(field()).toHaveAttribute('autocomplete', 'nickname');
    expect(field()).toHaveAttribute('dir', 'auto');
    expect(field()).toHaveAttribute('enterkeyhint', 'go');
    expect(field()).toHaveAttribute('maxLength', '20');
    expect(field()).toHaveAccessibleDescription("The poll's creator will see this name. 0/20");
  });

  test('pasted text is cut at 20 characters and the counter shows 20/20', async () => {
    render(<Form />);

    await userEvent.click(field());
    await userEvent.paste('Noa from the Haifa office team');

    expect(field()).toHaveValue('Noa from the Haifa o');
    expect(screen.getByText('20/20')).toBeInTheDocument();
  });

  test('removes line breaks and direction-override characters as pasted, and keeps emoji and right-to-left text', () => {
    render(<Form />);

    fireEvent.change(field(), { target: { value: 'נועה\n\u202E\u{1F33B}' } });

    expect(field()).toHaveValue('נועה \u{1F33B}');
  });

  test.each([
    ['empty', 'Enter a nickname.'],
    ['taken', 'This nickname is taken in this poll. Try another one.'],
  ])('the %s error is shown first in the description and marks the field invalid', (error, message) => {
    render(<Form error={error} initialValue={error === 'taken' ? 'noa' : ''} />);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field()).toHaveAttribute('aria-describedby', 'nickname-error nickname-help nickname-counter');
  });

  test('Enter submits the form once, the same as Join poll', async () => {
    const onSubmit = jest.fn((event) => event.preventDefault());
    render(<Form onSubmit={onSubmit} />);

    await userEvent.type(field(), 'Noa{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(field()).toHaveValue('Noa');
  });

  test('while locked, the field is read-only and Enter does not submit', async () => {
    const onSubmit = jest.fn((event) => event.preventDefault());
    render(<Form onSubmit={onSubmit} readOnly initialValue="Noa" />);

    await userEvent.type(field(), ' more{Enter}');

    expect(field()).toHaveValue('Noa');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('passes the field element to inputRef', () => {
    const inputRef = { current: null };
    render(<Form inputRef={inputRef} />);

    expect(inputRef.current).toBe(field());
  });
});
