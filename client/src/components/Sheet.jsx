import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Modal container (catalog: Sheet): a bottom sheet on mobile, a centered dialog from md.
 * - Focus moves to `initialFocusRef` (or the sheet itself), is trapped inside, and returns to the
 *   opener on close.
 * - Escape and a scrim tap call `onClose`. A press that starts inside the sheet and ends on the
 *   scrim (selecting text) does not close it.
 * - The page behind does not scroll; content taller than the viewport scrolls inside the sheet.
 * - `role`, `labelledBy` and `describedBy` come from the component using it.
 */
export default function Sheet({ open, onClose, role = 'dialog', labelledBy, describedBy, initialFocusRef, children }) {
  const sheetRef = useRef(null);
  const pressStartedInsideRef = useRef(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const opener = document.activeElement;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    const initialFocus = initialFocusRef && initialFocusRef.current;
    (initialFocus || sheetRef.current).focus();

    return () => {
      body.style.overflow = previousOverflow;
      if (opener && document.contains(opener)) {
        opener.focus();
      }
    };
    // Focus and scroll lock are set up once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) {
    return null;
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const focusable = Array.from(sheetRef.current.querySelectorAll(FOCUSABLE));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const inside = focusable.includes(document.activeElement);
    if (event.shiftKey && (document.activeElement === first || !inside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleScrimPointerDown(event) {
    if (event.target === event.currentTarget) {
      pressStartedInsideRef.current = false;
    }
  }

  function handleScrimClick(event) {
    const startedInside = pressStartedInsideRef.current;
    pressStartedInsideRef.current = false;
    if (event.target === event.currentTarget && !startedInside) {
      onClose();
    }
  }

  return (
    <div
      data-testid="dialog-scrim"
      onPointerDown={handleScrimPointerDown}
      onClick={handleScrimClick}
      className="fixed inset-0 z-modal flex items-end justify-center bg-scrim md:items-center md:px-5 md:py-5"
    >
      <div
        ref={sheetRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onPointerDown={() => {
          pressStartedInsideRef.current = true;
        }}
        className="flex max-h-full w-full flex-col gap-4 overflow-y-auto rounded-t-lg bg-surface px-5 pb-6 pt-3 shadow-lg outline-none motion-safe:animate-dialog-in md:max-w-dialog md:rounded-lg md:border md:border-text md:pt-6"
      >
        <span aria-hidden="true" data-testid="sheet-handle" className="mx-auto h-1 w-10 shrink-0 rounded-full bg-border-strong md:hidden" />
        {children}
      </div>
    </div>
  );
}
