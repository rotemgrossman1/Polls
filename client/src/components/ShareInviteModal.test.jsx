import { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import ShareInviteModal, { COPIED_DURATION_MS } from './ShareInviteModal';

const LINK = 'https://polls.test/i/q7Kx2Wm9aZ';

// Clicks are fired directly: user-event installs its own clipboard, which would hide the mocks.
function Harness({ link = LINK }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Share poll
      </button>
      <ShareInviteModal open={open} link={link} onClose={() => setOpen(false)} />
    </>
  );
}

function setClipboard(value) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

function setShare(value) {
  Object.defineProperty(navigator, 'share', { value, configurable: true, writable: true });
}

async function openSheet() {
  const opener = screen.getByRole('button', { name: 'Share poll' });
  opener.focus();
  fireEvent.click(opener);
  return screen.getByRole('dialog');
}

async function press(button) {
  await act(async () => {
    fireEvent.click(button);
  });
}

const liveRegion = () => screen.getByRole('status');

describe('ShareInviteModal', () => {
  let writeText;

  beforeEach(() => {
    jest.useFakeTimers();
    writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
  });

  afterEach(() => {
    jest.useRealTimers();
    delete navigator.clipboard;
    delete navigator.share;
    delete document.execCommand;
    window.getSelection().removeAllRanges();
  });

  test('shows the title, body, full link, Copy, Done and Close, with focus on Copy', async () => {
    render(<Harness />);

    const dialog = await openSheet();

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Invite people');
    expect(dialog).toHaveAccessibleDescription('Anyone with this link can join and answer your poll.');
    expect(within(dialog).getByRole('group', { name: 'Invite link' })).toHaveTextContent(LINK);
    expect(within(dialog).getByRole('button', { name: 'Copy' })).toHaveFocus();
    expect(within(dialog).getByRole('button', { name: 'Done' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(liveRegion()).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion()).toBeEmptyDOMElement();
  });

  test('a long link is shown in full and can wrap anywhere', async () => {
    const longLink = `https://a-very-long-subdomain-name.polls-app.onrender.com/i/${'q7Kx2Wm9aZ'}`;
    render(<Harness link={longLink} />);

    await openSheet();

    const text = screen.getByText(longLink);
    expect(text).toHaveClass('break-all', 'select-all');
    expect(text.textContent).toBe(longLink);
  });

  test('Copy copies the link, shows "Copied" for 2 seconds and announces "Link copied"', async () => {
    render(<Harness />);
    await openSheet();

    await press(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith(LINK);
    const copied = screen.getByRole('button', { name: 'Copied' });
    expect(copied).toHaveClass('bg-success');
    expect(liveRegion()).toHaveTextContent('Link copied');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(COPIED_DURATION_MS - 1);
    });
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByRole('button', { name: 'Copy' })).not.toHaveClass('bg-success');
    expect(liveRegion()).toBeEmptyDOMElement();
  });

  test('each tap copies again and restarts the 2 seconds', async () => {
    render(<Harness />);
    await openSheet();

    await press(screen.getByRole('button', { name: 'Copy' }));
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    await press(screen.getByRole('button', { name: 'Copied' }));
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(liveRegion()).toHaveTextContent('Link copied');

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  test('when the Clipboard API is blocked, copies with the copy command instead', async () => {
    writeText.mockRejectedValue(new Error('NotAllowedError'));
    document.execCommand = jest.fn(() => true);
    render(<Harness />);
    await openSheet();

    await press(screen.getByRole('button', { name: 'Copy' }));

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('when copying is blocked, shows the error under the link and selects the link text', async () => {
    delete navigator.clipboard;
    document.execCommand = jest.fn(() => false);
    render(<Harness />);
    await openSheet();

    await press(screen.getByRole('button', { name: 'Copy' }));

    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent("Couldn't copy the link. Select it and copy it yourself.");
    expect(screen.getByRole('group', { name: 'Invite link' })).toHaveAccessibleDescription(
      "Couldn't copy the link. Select it and copy it yourself.",
    );
    expect(window.getSelection().toString()).toBe(LINK);
    expect(screen.getByRole('button', { name: 'Copy' })).not.toHaveClass('bg-success');
    expect(liveRegion()).toBeEmptyDOMElement();

    // A later copy that works clears the error.
    document.execCommand = jest.fn(() => true);
    await press(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  test('Share link is hidden when the device does not support sharing', async () => {
    render(<Harness />);

    await openSheet();

    expect(screen.queryByRole('button', { name: 'Share link' })).not.toBeInTheDocument();
  });

  test('Share link opens the device share options with the spec text', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    setShare(share);
    render(<Harness />);
    await openSheet();

    await press(screen.getByRole('button', { name: 'Share link' }));

    expect(share).toHaveBeenCalledWith({ text: `Answer my poll here: ${LINK}` });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test.each([
    ['canceling', Object.assign(new Error('Share canceled'), { name: 'AbortError' })],
    ['a failed share', new TypeError('Not allowed')],
  ])('%s the device share options shows no error and keeps the sheet open', async (label, rejection) => {
    setShare(jest.fn().mockRejectedValue(rejection));
    render(<Harness />);
    await openSheet();

    await press(screen.getByRole('button', { name: 'Share link' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('Done, Close, Escape and a scrim tap close the sheet and return focus to the opener', async () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Share poll' });

    const closeWays = [
      () => fireEvent.click(screen.getByRole('button', { name: 'Done' })),
      () => fireEvent.click(screen.getByRole('button', { name: 'Close' })),
      () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' }),
      () => fireEvent.click(screen.getByTestId('dialog-scrim')),
    ];
    for (const close of closeWays) {
      // eslint-disable-next-line no-await-in-loop
      await openSheet();
      close();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    }
  });

  test('opening again shows the same link with Copy and no error', async () => {
    delete navigator.clipboard;
    document.execCommand = jest.fn(() => false);
    render(<Harness />);
    await openSheet();
    await press(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await openSheet();

    expect(screen.getByRole('group', { name: 'Invite link' })).toHaveTextContent(LINK);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('a copy that finishes after the sheet was closed changes nothing', async () => {
    let finishCopy;
    writeText.mockReturnValue(
      new Promise((resolve) => {
        finishCopy = resolve;
      }),
    );
    render(<Harness />);
    await openSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await act(async () => {
      finishCopy();
    });

    await openSheet();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(liveRegion()).toBeEmptyDOMElement();
  });
});
