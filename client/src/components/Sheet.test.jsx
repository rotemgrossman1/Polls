import { useRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sheet from './Sheet';

function Harness({ onClose = jest.fn(), withInitialFocus = true, children }) {
  const [open, setOpen] = useState(false);
  const firstRef = useRef(null);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Share poll
      </button>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
        labelledBy="sheet-title"
        describedBy="sheet-body"
        initialFocusRef={withInitialFocus ? firstRef : undefined}
      >
        <h2 id="sheet-title">Invite people</h2>
        <p id="sheet-body">Anyone with this link can join and answer your poll.</p>
        {children || (
          <>
            <button ref={firstRef} type="button">
              Copy
            </button>
            <a href="/help">Help</a>
            <input aria-label="Note" />
            <button type="button" disabled>
              Unavailable
            </button>
            <button type="button">Done</button>
          </>
        )}
      </Sheet>
    </>
  );
}

async function openSheet() {
  await userEvent.click(screen.getByRole('button', { name: 'Share poll' }));
  return screen.getByRole('dialog');
}

describe('Sheet', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  test('renders nothing while closed', () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('is a modal named and described by the labels it is given, with a decorative handle', async () => {
    render(<Harness />);

    const sheet = await openSheet();

    expect(sheet).toHaveAttribute('aria-modal', 'true');
    expect(sheet).toHaveAccessibleName('Invite people');
    expect(sheet).toHaveAccessibleDescription('Anyone with this link can join and answer your poll.');
    expect(screen.getByTestId('sheet-handle')).toHaveAttribute('aria-hidden', 'true');
  });

  test('moves focus to the initial focus element, or to the sheet itself', async () => {
    const { unmount } = render(<Harness />);
    await openSheet();
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();
    unmount();

    render(<Harness withInitialFocus={false} />);
    const sheet = await openSheet();
    expect(sheet).toHaveFocus();
  });

  test('traps focus over every focusable element, skipping disabled ones', async () => {
    render(<Harness />);
    await openSheet();
    const copy = screen.getByRole('button', { name: 'Copy' });
    const done = screen.getByRole('button', { name: 'Done' });

    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Help' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveFocus();
    await userEvent.tab();
    expect(done).toHaveFocus();
    await userEvent.tab();
    expect(copy).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(done).toHaveFocus();
  });

  test('Tab from the sheet itself goes to the first or last focusable element', async () => {
    render(<Harness withInitialFocus={false} />);
    const sheet = await openSheet();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();

    sheet.focus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus();
  });

  test('Escape and a scrim tap call onClose, and focus returns to the opener', async () => {
    const onClose = jest.fn();
    render(<Harness onClose={onClose} />);
    const opener = screen.getByRole('button', { name: 'Share poll' });

    await openSheet();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();

    await openSheet();
    await userEvent.click(screen.getByTestId('dialog-scrim'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  test('a click inside the sheet does not close it', async () => {
    const onClose = jest.fn();
    render(<Harness onClose={onClose} />);
    const sheet = await openSheet();

    await userEvent.click(sheet);
    await userEvent.click(screen.getByRole('heading', { name: 'Invite people' }));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('a press that starts inside the sheet and ends on the scrim does not close it', async () => {
    const onClose = jest.fn();
    render(<Harness onClose={onClose} />);
    const sheet = await openSheet();
    const scrim = screen.getByTestId('dialog-scrim');

    fireEvent.pointerDown(sheet);
    fireEvent.click(scrim);
    expect(onClose).not.toHaveBeenCalled();

    // The next tap that starts on the scrim closes it.
    fireEvent.pointerDown(scrim);
    fireEvent.click(scrim);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('locks page scrolling while open and restores it on close', async () => {
    document.body.style.overflow = 'scroll';
    render(<Harness />);

    await openSheet();
    expect(document.body.style.overflow).toBe('hidden');

    await userEvent.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('scroll');
  });

  test('content scrolls inside the sheet', async () => {
    render(<Harness />);

    const sheet = await openSheet();

    expect(sheet).toHaveClass('max-h-full', 'overflow-y-auto');
  });

  test('Tab does nothing when the sheet has nothing to focus', async () => {
    render(
      <Harness withInitialFocus={false}>
        <p>Nothing to press</p>
      </Harness>,
    );
    const sheet = await openSheet();

    await userEvent.tab();

    expect(sheet).toHaveFocus();
  });
});
