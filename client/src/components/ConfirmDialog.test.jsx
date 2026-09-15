import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

function Harness({ onConfirm = jest.fn(), onCancel = jest.fn() }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Cancel
      </button>
      <ConfirmDialog
        open={open}
        title="Discard this poll?"
        body="What you've entered will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setOpen(false);
          onConfirm();
        }}
        onCancel={() => {
          setOpen(false);
          onCancel();
        }}
      />
    </>
  );
}

async function openDialog() {
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  return screen.getByRole('alertdialog');
}

describe('ConfirmDialog', () => {
  test('renders nothing while closed', () => {
    render(<Harness />);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  test('is a modal alert dialog named by its title and described by its body, focused on the safe action', async () => {
    render(<Harness />);

    const dialog = await openDialog();

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Discard this poll?');
    expect(dialog).toHaveAccessibleDescription("What you've entered will be lost.");
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus();
  });

  test('Discard confirms', async () => {
    const onConfirm = jest.fn();
    render(<Harness onConfirm={onConfirm} />);
    await openDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('Keep editing, Escape, and a scrim tap all cancel and return focus to the opener', async () => {
    const onCancel = jest.fn();
    render(<Harness onCancel={onCancel} />);
    const opener = screen.getByRole('button', { name: 'Cancel' });

    await openDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(opener).toHaveFocus();

    await openDialog();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();

    await openDialog();
    fireEvent.click(screen.getByTestId('dialog-scrim'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  test('a click inside the dialog does not cancel', async () => {
    const onCancel = jest.fn();
    render(<Harness onCancel={onCancel} />);
    const dialog = await openDialog();

    fireEvent.click(dialog);

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  test('keeps focus inside the dialog', async () => {
    render(<Harness />);
    await openDialog();
    const discard = screen.getByRole('button', { name: 'Discard' });
    const keepEditing = screen.getByRole('button', { name: 'Keep editing' });

    await userEvent.tab();
    expect(discard).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(keepEditing).toHaveFocus();
  });
});
