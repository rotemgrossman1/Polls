import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from './TextInput';

function Controlled({ initialValue = '', onValue, ...props }) {
  const [value, setValue] = useState(initialValue);
  return (
    <TextInput
      value={value}
      onChange={(next) => {
        setValue(next);
        if (onValue) onValue(next);
      }}
      {...props}
    />
  );
}

describe('TextInput', () => {
  test('has a visible label, a placeholder, and a live counter', async () => {
    render(
      <Controlled id="question" label="Question" placeholder="What do you want to ask?" maxLength={200} large />,
    );

    const field = screen.getByLabelText('Question');
    expect(field).toHaveAttribute('placeholder', 'What do you want to ask?');
    expect(field).toHaveAttribute('maxLength', '200');
    expect(field).toHaveAttribute('dir', 'auto');
    expect(screen.getByText('0/200')).toBeInTheDocument();

    await userEvent.type(field, 'Lunch?');
    expect(screen.getByText('6/200')).toBeInTheDocument();
    expect(field).toHaveAccessibleDescription('6/200');
  });

  test('shows an error linked before the counter and marks the field invalid', () => {
    render(
      <Controlled id="question" label="Question" maxLength={200} error="Enter a question." />,
    );

    const field = screen.getByLabelText('Question');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-describedby', 'question-error question-counter');
    expect(field).toHaveAccessibleDescription('Enter a question. 0/200');
  });

  test('has no error state without an error', () => {
    render(<Controlled id="question" label="Question" maxLength={200} />);

    expect(screen.getByLabelText('Question')).not.toHaveAttribute('aria-invalid');
  });

  test('single-line fields turn pasted line breaks into spaces and ignore Enter', async () => {
    const onValue = jest.fn();
    render(<Controlled id="option" label="Option 1" maxLength={100} onValue={onValue} />);
    const field = screen.getByLabelText('Option 1');

    fireEvent.change(field, { target: { value: 'Tel Aviv\nbeach' } });
    expect(field).toHaveValue('Tel Aviv beach');

    await userEvent.type(field, '{Enter}');
    expect(field).toHaveValue('Tel Aviv beach');
  });

  test('multiline fields keep line breaks', () => {
    render(<Controlled id="details" label="Details (optional)" maxLength={1000} variant="multiline" />);
    const field = screen.getByLabelText('Details (optional)');

    fireEvent.change(field, { target: { value: 'Line one\nLine two' } });

    expect(field).toHaveValue('Line one\nLine two');
  });

  test('read-only fields cannot be edited', async () => {
    render(<Controlled id="question" label="Question" maxLength={200} initialValue="Lunch?" readOnly />);
    const field = screen.getByLabelText('Question');

    await userEvent.type(field, ' more');

    expect(field).toHaveValue('Lunch?');
  });

  test('without a label prop the caller can label the field', () => {
    render(
      <>
        <label htmlFor="option-1">Option 1</label>
        <Controlled id="option-1" maxLength={100} placeholder="Option 1" />
      </>,
    );

    expect(screen.getByLabelText('Option 1')).toHaveAttribute('id', 'option-1');
  });

  test('passes the field element to inputRef', () => {
    const inputRef = { current: null };
    render(<Controlled id="question" label="Question" maxLength={200} inputRef={inputRef} />);

    expect(inputRef.current).toBe(screen.getByLabelText('Question'));
  });
});
