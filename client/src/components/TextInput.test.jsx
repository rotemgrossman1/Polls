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

  test('single-line fields remove control characters and lone surrogates and turn tabs into spaces', () => {
    const onValue = jest.fn();
    render(<Controlled id="option" label="Option 1" maxLength={100} onValue={onValue} />);
    const field = screen.getByLabelText('Option 1');

    fireEvent.change(field, { target: { value: 'Su\u0000shi\u0007\tbar \uD800' } });

    expect(field).toHaveValue('Sushi bar ');
    expect(onValue).toHaveBeenLastCalledWith('Sushi bar ');
  });

  test('multiline fields remove control characters and lone surrogates but keep tabs and line breaks', () => {
    render(<Controlled id="details" label="Details (optional)" maxLength={1000} variant="multiline" />);
    const field = screen.getByLabelText('Details (optional)');

    fireEvent.change(field, { target: { value: 'Menu:\n\tPizza\u001B\u0000\uDC00' } });

    expect(field).toHaveValue('Menu:\n\tPizza');
  });

  test('grows to fit its content, with the borders added to the content height', () => {
    // jsdom has no layout: content plus padding is 72px, and the borders take 4px.
    const layout = { scrollHeight: 72, offsetHeight: 52, clientHeight: 48 };
    Object.entries(layout).forEach(([name, size]) => {
      Object.defineProperty(HTMLTextAreaElement.prototype, name, { configurable: true, get: () => size });
    });

    try {
      render(<Controlled id="question" label="Question" maxLength={200} />);
      const field = screen.getByLabelText('Question');

      fireEvent.change(field, { target: { value: 'A question long enough to wrap' } });

      expect(field.style.height).toBe('76px');
    } finally {
      Object.keys(layout).forEach((name) => delete HTMLTextAreaElement.prototype[name]);
    }
  });

  test('cleans pasted text before the browser inserts it, so the caret stays after the pasted text', () => {
    document.execCommand = jest.fn(() => true);
    try {
      render(<Controlled id="question" label="Question" maxLength={200} />);
      const event = new InputEvent('beforeinput', {
        data: 'at\u0000\u202E\tnoon',
        inputType: 'insertFromPaste',
        bubbles: true,
        cancelable: true,
      });

      screen.getByLabelText('Question').dispatchEvent(event);

      expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'at noon');
      expect(event.defaultPrevented).toBe(true);
    } finally {
      delete document.execCommand;
    }
  });

  test('lets text that needs no cleaning be inserted by the browser as typed', () => {
    document.execCommand = jest.fn(() => true);
    try {
      render(<Controlled id="details" label="Details (optional)" maxLength={1000} variant="multiline" />);
      const event = new InputEvent('beforeinput', {
        data: 'Line one\n\tLine two',
        inputType: 'insertText',
        bubbles: true,
        cancelable: true,
      });

      screen.getByLabelText('Details (optional)').dispatchEvent(event);

      expect(document.execCommand).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    } finally {
      delete document.execCommand;
    }
  });

  test('fits its content again when its width changes, and only then', () => {
    let notifyResize;
    global.ResizeObserver = jest.fn((callback) => {
      notifyResize = callback;
      return { observe: jest.fn(), disconnect: jest.fn() };
    });
    // jsdom has no layout: the borders take 4px, and content plus padding grows as the field narrows.
    const layout = { scrollHeight: 72, offsetHeight: 52, clientHeight: 48, clientWidth: 300 };
    Object.keys(layout).forEach((name) => {
      Object.defineProperty(HTMLTextAreaElement.prototype, name, { configurable: true, get: () => layout[name] });
    });

    try {
      render(<Controlled id="question" label="Question" maxLength={200} initialValue="A question long enough to wrap" />);
      const field = screen.getByLabelText('Question');
      expect(field.style.height).toBe('76px');

      layout.clientWidth = 200;
      layout.scrollHeight = 120;
      notifyResize();
      expect(field.style.height).toBe('124px');

      layout.scrollHeight = 200;
      notifyResize();
      expect(field.style.height).toBe('124px');
    } finally {
      Object.keys(layout).forEach((name) => delete HTMLTextAreaElement.prototype[name]);
      delete global.ResizeObserver;
    }
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
