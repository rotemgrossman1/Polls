import { useEffect, useId, useRef } from 'react';
import Button from './Button';

/**
 * Confirms a destructive action (catalog: ConfirmDialog). Bottom sheet on mobile,
 * centered dialog from md. Initial focus is on the safe action; focus is trapped inside;
 * Escape and a scrim tap act as the safe action; focus returns to the opener on close.
 */
export default function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const opener = document.activeElement;
    cancelRef.current.focus();

    return () => {
      if (opener && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const focusable = dialogRef.current.querySelectorAll('button:not([disabled])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleScrimClick(event) {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  }

  return (
    <div
      data-testid="dialog-scrim"
      onClick={handleScrimClick}
      className="fixed inset-0 z-modal flex items-end justify-center bg-scrim md:items-center md:px-5"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={handleKeyDown}
        className="flex w-full flex-col gap-4 rounded-t-lg bg-surface px-5 pb-6 pt-3 shadow-lg motion-safe:animate-dialog-in md:max-w-dialog md:rounded-lg md:border md:border-text md:pt-6"
      >
        <span aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-border-strong md:hidden" />
        <h2 id={titleId} className="text-xl font-bold leading-tight text-text">
          {title}
        </h2>
        <p id={bodyId} className="text-base text-text">
          {body}
        </p>
        <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
          <Button variant="danger" block="mobile" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button ref={cancelRef} variant="secondary" block="mobile" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
