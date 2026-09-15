import { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptionListEditor from './OptionListEditor';
import useCreatePollForm from '../hooks/useCreatePollForm';

jest.mock('../services/pollService', () => ({ createPoll: jest.fn() }));

const ROW_HEIGHT = 60;
const ROW_GAP = 12;

// errorsFor(options) lets a test attach errors to this harness's own option keys.
function Harness({ errorsFor, locked = false }) {
  const form = useCreatePollForm({ onCreated: jest.fn() });
  const fieldRefs = useRef(new Map());
  return (
    <OptionListEditor
      options={form.options}
      errors={errorsFor ? errorsFor(form.options) : form.errors.options}
      canAdd={form.canAddOption}
      canRemove={form.canRemoveOption}
      locked={locked}
      fieldRefs={fieldRefs}
      onAdd={form.addOption}
      onRemove={form.removeOption}
      onChangeText={form.setOptionText}
      onMove={form.moveOption}
    />
  );
}

// Option fields by accessible name ("Option n"), as screen readers announce them.
const optionField = (n) => screen.getByRole('textbox', { name: `Option ${n}` });
const fields = () => screen.getAllByRole('textbox');
const values = () => fields().map((field) => field.value);

async function addOptions(count) {
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await userEvent.click(screen.getByRole('button', { name: 'Add option' }));
  }
}

async function fillOptions(texts) {
  for (let i = 0; i < texts.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await userEvent.type(fields()[i], texts[i]);
  }
}

describe('OptionListEditor', () => {
  test('starts with two labeled options, drag handles, counters, and no remove buttons', () => {
    render(<Harness />);

    expect(screen.getByRole('group', { name: 'Options' })).toHaveAccessibleDescription(
      'Add 2 to 8 options. Drag to reorder.',
    );
    expect(optionField(1)).toHaveAttribute('placeholder', 'Option 1');
    expect(optionField(2)).toHaveAttribute('placeholder', 'Option 2');
    expect(screen.getByRole('button', { name: 'Drag to reorder option 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Drag to reorder option 2' })).toBeInTheDocument();
    // The grip is drawn as filled dots, not hairline strokes.
    const grip = screen.getByRole('button', { name: 'Drag to reorder option 1' }).querySelector('svg');
    expect(grip).toHaveAttribute('fill', 'currentColor');
    expect(grip).toHaveAttribute('stroke', 'none');
    expect(grip).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByText('0/100')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Remove option/ })).not.toBeInTheDocument();
  });

  test('Add option appends an empty option, focuses it, and shows remove buttons', async () => {
    render(<Harness />);

    await addOptions(1);

    expect(fields()).toHaveLength(3);
    expect(optionField(3)).toHaveFocus();
    expect(optionField(3)).toHaveValue('');
    ['Remove option 1', 'Remove option 2', 'Remove option 3'].forEach((name) =>
      expect(screen.getByRole('button', { name })).toBeInTheDocument(),
    );
  });

  test('at 8 options Add option is unavailable and the limit hint is shown', async () => {
    render(<Harness />);
    expect(screen.queryByText('You can add up to 8 options.')).not.toBeInTheDocument();

    await addOptions(6);

    const add = screen.getByRole('button', { name: 'Add option' });
    expect(fields()).toHaveLength(8);
    expect(add).toHaveAttribute('aria-disabled', 'true');
    expect(add).toHaveAccessibleDescription('You can add up to 8 options.');

    await userEvent.click(add);
    expect(fields()).toHaveLength(8);
  });

  test('removing an option deletes it, renumbers the rest, and focuses the next field', async () => {
    render(<Harness />);
    await addOptions(1);
    await fillOptions(['Pizza', 'Sushi', 'Tacos']);

    await userEvent.click(screen.getByRole('button', { name: 'Remove option 2' }));

    expect(values()).toEqual(['Pizza', 'Tacos']);
    expect(optionField(2)).toHaveValue('Tacos');
    expect(optionField(2)).toHaveAttribute('placeholder', 'Option 2');
    expect(optionField(2)).toHaveFocus();
    expect(screen.queryByRole('button', { name: /Remove option/ })).not.toBeInTheDocument();
  });

  test('removing the last option focuses the previous field', async () => {
    render(<Harness />);
    await addOptions(2);
    await fillOptions(['Pizza', 'Sushi', 'Tacos', 'Falafel']);

    await userEvent.click(screen.getByRole('button', { name: 'Remove option 4' }));

    expect(values()).toEqual(['Pizza', 'Sushi', 'Tacos']);
    expect(optionField(3)).toHaveFocus();
  });

  test('shows each option error under its field', () => {
    render(
      <Harness
        errorsFor={([first, second]) => ({ [first.key]: 'empty', [second.key]: 'duplicate' })}
      />,
    );

    expect(optionField(1)).toHaveAttribute('aria-invalid', 'true');
    expect(optionField(1)).toHaveAccessibleDescription('Fill in this option or remove it. 0/100');
    expect(optionField(2)).toHaveAccessibleDescription('This option is already in the list. 0/100');
  });

  test('locked: fields are read-only and handles, remove, and Add option are disabled', async () => {
    const { rerender } = render(<Harness />);
    await addOptions(1);

    rerender(<Harness locked />);

    fields().forEach((field) => expect(field).toHaveAttribute('readonly'));
    screen.getAllByRole('button', { name: /Drag to reorder/ }).forEach((b) => expect(b).toBeDisabled());
    screen.getAllByRole('button', { name: /Remove option/ }).forEach((b) => expect(b).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Add option' })).toBeDisabled();
  });

  describe('dragging', () => {
    beforeEach(() => {
      // Rows are ROW_HEIGHT tall with ROW_GAP between them; the list starts at 0.
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
        if (this.matches('[data-option-row]')) {
          const top = Number(this.dataset.index) * (ROW_HEIGHT + ROW_GAP);
          return { top, bottom: top + ROW_HEIGHT, height: ROW_HEIGHT, left: 0, right: 0, width: 0, x: 0, y: top };
        }
        return { top: 0, bottom: 0, height: 0, left: 0, right: 0, width: 0, x: 0, y: 0 };
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    function startDrag(handleName, { from, to }) {
      const handle = screen.getByRole('button', { name: handleName });
      fireEvent.pointerDown(handle, { clientY: from, pointerId: 1, pointerType: 'touch', button: 0 });
      fireEvent.pointerMove(handle, { clientY: to, pointerId: 1, pointerType: 'touch' });
      return handle;
    }

    test('dragging an option by its handle moves it to the drop position', async () => {
      render(<Harness />);
      await addOptions(1);
      await fillOptions(['Pizza', 'Sushi', 'Tacos']);

      const handle = startDrag('Drag to reorder option 1', { from: 30, to: 200 });
      expect(screen.getByTestId('drop-slot')).toBeInTheDocument();
      fireEvent.pointerUp(handle, { clientY: 200, pointerId: 1, pointerType: 'touch' });

      expect(values()).toEqual(['Sushi', 'Tacos', 'Pizza']);
      expect(screen.queryByTestId('drop-slot')).not.toBeInTheDocument();
      expect(optionField(3)).toHaveValue('Pizza');
    });

    test('dragging the last option to the top', async () => {
      render(<Harness />);
      await addOptions(1);
      await fillOptions(['Pizza', 'Sushi', 'Tacos']);

      const handle = startDrag('Drag to reorder option 3', { from: 174, to: 20 });
      fireEvent.pointerUp(handle, { clientY: 20, pointerId: 1, pointerType: 'touch' });

      expect(values()).toEqual(['Tacos', 'Pizza', 'Sushi']);
    });

    test('a small move that does not pass a neighbor keeps the order', async () => {
      render(<Harness />);
      await fillOptions(['Pizza', 'Sushi']);

      const handle = startDrag('Drag to reorder option 1', { from: 30, to: 60 });
      fireEvent.pointerUp(handle, { clientY: 60, pointerId: 1, pointerType: 'touch' });

      expect(values()).toEqual(['Pizza', 'Sushi']);
    });

    test('a secondary mouse button does not start a drag', async () => {
      render(<Harness />);
      await fillOptions(['Pizza', 'Sushi']);

      const handle = screen.getByRole('button', { name: 'Drag to reorder option 1' });
      fireEvent.pointerDown(handle, { clientY: 30, pointerId: 1, pointerType: 'mouse', button: 2 });

      expect(screen.queryByTestId('drop-slot')).not.toBeInTheDocument();
    });

    test('Escape cancels the drag without moving anything', async () => {
      render(<Harness />);
      await fillOptions(['Pizza', 'Sushi']);

      const handle = startDrag('Drag to reorder option 1', { from: 30, to: 120 });
      expect(screen.getByTestId('drop-slot')).toBeInTheDocument();
      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(screen.queryByTestId('drop-slot')).not.toBeInTheDocument();
      fireEvent.pointerUp(handle, { clientY: 120, pointerId: 1, pointerType: 'touch' });

      expect(values()).toEqual(['Pizza', 'Sushi']);
    });

    test('a pointer cancel (e.g. the browser takes over the gesture) moves nothing', async () => {
      render(<Harness />);
      await fillOptions(['Pizza', 'Sushi']);

      const handle = startDrag('Drag to reorder option 1', { from: 30, to: 120 });
      fireEvent.pointerCancel(handle, { pointerId: 1, pointerType: 'touch' });

      expect(values()).toEqual(['Pizza', 'Sushi']);
      expect(screen.queryByTestId('drop-slot')).not.toBeInTheDocument();
    });

    test('holding a drag near the bottom or top of the viewport scrolls the page, and dropping stops it', async () => {
      const frames = [];
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.push(callback);
        return frames.length;
      });
      const cancelFrame = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
      const scrollBy = jest.spyOn(window, 'scrollBy').mockImplementation(() => {});
      const runNextFrame = () => act(() => {
        frames.shift()();
      });
      render(<Harness />);
      await fillOptions(['Pizza', 'Sushi']);

      const handle = startDrag('Drag to reorder option 1', { from: 30, to: window.innerHeight - 10 });
      runNextFrame();
      expect(scrollBy).toHaveBeenLastCalledWith(0, 8);

      fireEvent.pointerMove(handle, { clientY: 10, pointerId: 1, pointerType: 'touch' });
      runNextFrame();
      expect(scrollBy).toHaveBeenLastCalledWith(0, -8);

      fireEvent.pointerMove(handle, { clientY: 300, pointerId: 1, pointerType: 'touch' });
      scrollBy.mockClear();
      runNextFrame();
      expect(scrollBy).not.toHaveBeenCalled();

      fireEvent.pointerUp(handle, { clientY: 300, pointerId: 1, pointerType: 'touch' });
      expect(cancelFrame).toHaveBeenCalled();
    });

    test('a locked list cannot be dragged', async () => {
      const { rerender } = render(<Harness />);
      await fillOptions(['Pizza', 'Sushi']);
      rerender(<Harness locked />);

      const handle = startDrag('Drag to reorder option 1', { from: 30, to: 120 });
      fireEvent.pointerUp(handle, { clientY: 120, pointerId: 1, pointerType: 'touch' });

      expect(values()).toEqual(['Pizza', 'Sushi']);
      expect(screen.queryByTestId('drop-slot')).not.toBeInTheDocument();
    });
  });
});
